import { Router } from 'express';
import { PrismaClient } from '@krg-evisit/database';
import { SMSService } from '../services/sms';

const router = Router();
const prisma = new PrismaClient();

// Simple verify endpoint - just get application by ID
router.post('/verify', async (req, res) => {
  try {
    const { qrPayload, action } = req.body;

    // Extract application ID from QR code format: KRG-PERMIT-{id}
    const match = qrPayload.match(/^KRG-PERMIT-(.+)$/);
    if (!match) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QR', message: 'Invalid QR code format' }
      });
    }

    const applicationId = match[1];

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' }
      });
    }

    // Check if approved or active
    if (application.status !== 'APPROVED' && application.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_APPROVED',
          message: `Permit is not valid. Status: ${application.status}`
        }
      });
    }

    // Check expiry using visitEndDate
    const now = new Date();
    const endDate = new Date(application.visitEndDate);
    if (endDate < now) {
      return res.status(403).json({
        success: false,
        error: { code: 'PERMIT_EXPIRED', message: 'Permit has expired' }
      });
    }

    // If recording entry
    if (action === 'ENTRY') {
      // Create entry log
      const entryLog = await prisma.entryExitLog.create({
        data: {
          applicationId,
          logType: 'ENTRY',
          checkpointName: req.body.checkpointName || 'Checkpoint',
          recordedAt: new Date(),
        },
      });

      // Update application status to ACTIVE
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'ACTIVE' },
      });

      // Send welcome SMS
      try {
        await SMSService.sendEntryRecorded(
          application.phoneNumber,
          application.fullName,
          req.body.checkpointName || 'Kurdistan'
        );
      } catch (smsError) {
        console.error('Failed to send entry SMS:', smsError);
      }

      return res.json({
        success: true,
        data: {
          application: {
            referenceNumber: application.referenceNumber,
            fullName: application.fullName,
            nationality: application.nationality,
            visitPurpose: application.visitPurpose,
            status: 'ACTIVE',
          },
          entryLog,
          message: 'Entry recorded successfully'
        }
      });
    }

    // If recording exit
    if (action === 'EXIT') {
      // Create exit log
      const exitLog = await prisma.entryExitLog.create({
        data: {
          applicationId,
          logType: 'EXIT',
          checkpointName: req.body.checkpointName || 'Checkpoint',
          recordedAt: new Date(),
        },
      });

      // Update application status to COMPLETED
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'COMPLETED' },
      });

      return res.json({
        success: true,
        data: {
          application: {
            referenceNumber: application.referenceNumber,
            fullName: application.fullName,
            status: 'COMPLETED',
          },
          exitLog,
          message: 'Exit recorded successfully'
        }
      });
    }

    // If just verifying (no action)
    return res.json({
      success: true,
      data: {
        application: {
          referenceNumber: application.referenceNumber,
          fullName: application.fullName,
          nationality: application.nationality,
          visitPurpose: application.visitPurpose,
          visitStartDate: application.visitStartDate,
          visitEndDate: application.visitEndDate,
          status: application.status,
        }
      }
    });
  } catch (error) {
    console.error('Checkpoint verification error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to verify QR code' }
    });
  }
});

// Get today's logs
router.get('/logs/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await prisma.entryExitLog.findMany({
      where: {
        recordedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        application: {
          select: {
            referenceNumber: true,
            fullName: true,
            nationality: true,
            visitPurpose: true,
          },
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve logs' }
    });
  }
});

// Get active visitors
router.get('/active', async (req, res) => {
  try {
    const activeApplications = await prisma.application.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        referenceNumber: true,
        fullName: true,
        nationality: true,
        phoneNumber: true,
        visitEndDate: true,
        entryExitLogs: {
          where: { logType: 'ENTRY' },
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    return res.json({
      success: true,
      data: activeApplications,
    });
  } catch (error) {
    console.error('Error fetching active visitors:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch active visitors' }
    });
  }
});

export default router;
