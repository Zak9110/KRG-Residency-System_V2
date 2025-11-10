import { Router, Request, Response } from 'express';
import { PrismaClient } from '@krg-visit/database';
import { SMSService } from '../services/sms';

const prisma = new PrismaClient();
const router = Router();

// Verify QR code and record entry/exit
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { qrPayload, checkpointId, checkpointName, action } = req.body;

    // Verify QR signature
    const verificationResult = await verifyQRCode(qrPayload);

    if (!verificationResult.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QR',
          message: verificationResult.error || 'Invalid QR code'
        }
      });
    }

    const { applicationId } = verificationResult;

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        entryExitLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' }
      });
    }

    // Check if approved
    if (application.status !== ApplicationStatus.APPROVED) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_APPROVED',
          message: 'Application is not approved'
        }
      });
    }

    // Check validity dates
    const now = new Date();
    if (!application.validFrom || !application.validUntil) {
      return res.status(403).json({
        success: false,
        error: { code: 'NO_VALIDITY', message: 'Permit validity not set' }
      });
    }

    if (now < new Date(application.validFrom) || now > new Date(application.validUntil)) {
      return res.status(403).json({
        success: false,
        error: { code: 'PERMIT_EXPIRED', message: 'Permit is not valid for current date' }
      });
    }

    // Check internal watchlist
    const watchlistEntry = await prisma.internalWatchlist.findFirst({
      where: {
        OR: [
          { passportNumber: application.passportNumber },
          { email: application.email }
        ],
        isActive: true
      }
    });

    if (watchlistEntry) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'WATCHLIST_ALERT',
          message: 'Person is on internal watchlist',
          data: {
            reason: watchlistEntry.reason,
            flaggedBy: watchlistEntry.flaggedBy
          }
        }
      });
    }

    // Determine new status based on action and current location
    let newStatus = application.status;
    let newLocation = application.currentLocation;

    if (action === 'ENTRY') {
      if (application.currentLocation === 'NOT_ENTERED') {
        newStatus = ApplicationStatus.ENTERED;
        newLocation = checkpointName;
      } else if (application.currentLocation === 'EXITED') {
        newStatus = ApplicationStatus.RE_ENTERED;
        newLocation = checkpointName;
      } else {
        return res.status(400).json({
          success: false,
          error: { code: 'ALREADY_INSIDE', message: 'Visitor is already inside KRG' }
        });
      }
    } else if (action === 'EXIT') {
      if (application.currentLocation !== 'NOT_ENTERED' && application.currentLocation !== 'EXITED') {
        newStatus = ApplicationStatus.EXITED;
        newLocation = 'EXITED';
      } else {
        return res.status(400).json({
          success: false,
          error: { code: 'NOT_INSIDE', message: 'Visitor is not inside KRG' }
        });
      }
    }

    // Record entry/exit log
    const entryExitLog = await prisma.entryExitLog.create({
      data: {
        applicationId,
        checkpointId,
        checkpointName,
        action,
        timestamp: new Date()
      }
    });

    // Update application status and location
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        currentLocation: newLocation
      }
    });

    return res.json({
      success: true,
      data: {
        application: {
          referenceNumber: updatedApplication.referenceNumber,
          fullName: updatedApplication.fullName,
          nationality: updatedApplication.nationality,
          passportNumber: updatedApplication.passportNumber,
          visitPurpose: updatedApplication.visitPurpose,
          validFrom: updatedApplication.validFrom,
          validUntil: updatedApplication.validUntil,
          currentLocation: updatedApplication.currentLocation,
          status: updatedApplication.status
        },
        entryExitLog,
        message: `${action === 'ENTRY' ? 'Entry' : 'Exit'} recorded successfully`
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

// Get checkpoint logs (for checkpoint officers)
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { checkpointId, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where = checkpointId ? { checkpointId: checkpointId as string } : {};

    const [logs, total] = await Promise.all([
      prisma.entryExitLog.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { timestamp: 'desc' },
        include: {
          application: {
            select: {
              referenceNumber: true,
              fullName: true,
              nationality: true,
              passportNumber: true,
              visitPurpose: true
            }
          }
        }
      }),
      prisma.entryExitLog.count({ where })
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve logs' }
    });
  }
});

export default router;
