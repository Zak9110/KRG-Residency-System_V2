import { Router, Request, Response } from 'express';
import { PrismaClient } from '@krg-evisit/database';
import { SMSService } from '../services/sms';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/applications (public - submit application)
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      nationalId,
      phoneNumber,
      email,
      dateOfBirth,
      nationality,
      originGovernorate,
      destinationGovernorate,
      visitPurpose,
      visitStartDate,
      visitEndDate,
      declaredAccommodation
    } = req.body;

    // Generate reference number
    const count = await prisma.application.count();
    const referenceNumber = `KRG-2025-${String(count + 1).padStart(6, '0')}`;

    // Set processing deadline (72 hours from now)
    const processingDeadline = new Date();
    processingDeadline.setHours(processingDeadline.getHours() + 72);

    const application = await prisma.application.create({
      data: {
        referenceNumber,
        fullName,
        nationalId,
        phoneNumber,
        email,
        dateOfBirth: new Date(dateOfBirth),
        nationality: nationality || 'Iraq',
        originGovernorate,
        destinationGovernorate,
        visitPurpose,
        visitStartDate: new Date(visitStartDate),
        visitEndDate: new Date(visitEndDate),
        declaredAccommodation,
        status: 'SUBMITTED',
        processingDeadline,
        language: 'ar' // Default to Arabic
      }
    });

    // Send SMS confirmation
    await SMSService.sendApplicationSubmitted(application.phoneNumber, application.referenceNumber);

    res.status(201).json({ success: true, data: application });
  } catch (error: any) {
    console.error('Application creation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create application' }
    });
  }
});

/**
 * GET /api/applications (get all applications or search by reference)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.query;

    // If reference number provided, search for that specific application
    if (ref) {
      const applications = await prisma.application.findMany({
        where: {
          referenceNumber: String(ref).toUpperCase()
        },
        include: {
          documents: {
            select: {
              id: true,
              documentType: true,
              fileName: true,
              fileUrl: true,
              uploadedAt: true
            }
          }
        }
      });
      
      res.json({ success: true, data: applications });
      return;
    }

    // Otherwise return all applications
    const applications = await prisma.application.findMany({
      orderBy: [
        { priorityLevel: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        documents: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            uploadedAt: true
          }
        }
      }
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch applications' }
    });
  }
});

/**
 * GET /api/applications/:id (get single application)
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        documents: true,
        entryExitLogs: {
          orderBy: { recordedAt: 'desc' }
        }
      }
    });

    if (!application) {
      res.status(404).json({
        success: false,
        error: { message: 'Application not found' }
      });
      return;
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch application' }
    });
  }
});

/**
 * PATCH /api/applications/:id/approve (approve application)
 */
router.patch('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { approvalNotes, officerId } = req.body;

    // Calculate permit expiry (use visitEndDate or default 30 days)
    const app = await prisma.application.findUnique({
      where: { id },
      select: { visitEndDate: true }
    });

    if (!app) {
      res.status(404).json({
        success: false,
        error: { message: 'Application not found' }
      });
      return;
    }

    const permitExpiryDate = app.visitEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvalDate: new Date(),
        // Don't set approvedById until we have actual users in the database
        // approvedById: officerId || null,
        approvalNotes,
        permitExpiryDate,
        // Generate simple QR code data
        qrCode: `KRG-PERMIT-${id}`,
        qrCodeSignature: `SIGNATURE-${Date.now()}`
      },
      include: {
        documents: true
      }
    });

    // Create audit log (skip for now since we don't have users)
    // await prisma.auditLog.create({
    //   data: {
    //     userId: officerId || 'system',
    //     action: 'APPROVE_APPLICATION',
    //     details: approvalNotes
    //   }
    // });

    // Send SMS approval notification
    await SMSService.sendApprovalNotification(application.phoneNumber, application.referenceNumber);

    res.json({ success: true, data: application });
  } catch (error: any) {
    console.error('Approve error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve application' }
    });
  }
});

/**
 * PATCH /api/applications/:id/reject (reject application)
 */
router.patch('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason, rejectionNotes, officerId } = req.body;

    if (!rejectionReason) {
      res.status(400).json({
        success: false,
        error: { message: 'Rejection reason is required' }
      });
      return;
    }

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionDate: new Date(),
        // Don't set rejectedById until we have actual users in the database
        // rejectedById: officerId || null,
        rejectionReason,
        rejectionNotes
      }
    });

    // Create audit log (skip for now since we don't have users)
    // await prisma.auditLog.create({
    //   data: {
    //     userId: officerId || 'system',
    //     action: 'REJECT_APPLICATION',
    //     details: `${rejectionReason}: ${rejectionNotes || ''}`
    //   }
    // });

    // Send SMS rejection notification
    await SMSService.sendRejectionNotification(application.phoneNumber, application.referenceNumber, rejectionReason);

    res.json({ success: true, data: application });
  } catch (error: any) {
    console.error('Reject error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reject application' }
    });
  }
});

/**
 * PATCH /api/applications/:id/request-documents (request more documents)
 */
router.patch('/:id/request-documents', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { requestedDocuments, notes, officerId } = req.body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: 'PENDING_DOCUMENTS',
        rejectionNotes: `Requested documents: ${requestedDocuments}. ${notes || ''}`
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: officerId || 'system',
        action: 'REQUEST_DOCUMENTS',
        details: `Requested: ${requestedDocuments}`
      }
    });

    // Send SMS notification about requested documents
    await SMSService.sendDocumentsRequested(application.phoneNumber, application.referenceNumber);

    res.json({ success: true, data: application });
  } catch (error: any) {
    console.error('Request documents error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to request documents' }
    });
  }
});

export default router;
