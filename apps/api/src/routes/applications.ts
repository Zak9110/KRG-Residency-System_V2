import { Router, Request, Response } from 'express';
import { prisma } from '@krg-evisit/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import { ApplicationStatus, UserRole } from '@krg-evisit/shared-types';
import { generateQRCode } from '../services/qr';
import { sendEmail } from '../services/email';

const router = Router();

// Create new application (public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      nationality,
      passportNumber,
      dateOfBirth,
      gender,
      email,
      phoneNumber,
      visitPurpose,
      organizationName,
      contactPersonName,
      contactPersonPhone,
      intendedEntryDate,
      intendedExitDate,
      accommodationAddress,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation
    } = req.body;

    // Generate reference number
    const count = await prisma.application.count();
    const referenceNumber = `KRG-2025-${String(count + 1).padStart(6, '0')}`;

    const application = await prisma.application.create({
      data: {
        referenceNumber,
        fullName,
        nationalId: req.body.nationalId || '',
        phoneNumber,
        email,
        dateOfBirth: new Date(dateOfBirth),
        nationality: nationality || 'Iraq',
        originGovernorate: req.body.originGovernorate || '',
        destinationGovernorate: req.body.destinationGovernorate || '',
        visitPurpose,
        visitStartDate: new Date(req.body.visitStartDate),
        visitEndDate: new Date(req.body.visitEndDate),
        declaredAccommodation: req.body.declaredAccommodation,
        status: 'SUBMITTED'
      }
    });

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'KRG e-Visit Application Received',
      html: `
        <h2>Application Received</h2>
        <p>Dear ${fullName},</p>
        <p>Your e-Visit application has been received successfully.</p>
        <p><strong>Reference Number:</strong> ${referenceNumber}</p>
        <p>You can track your application status using this reference number.</p>
        <p>Thank you for using KRG e-Visit System.</p>
      `
    });

    return res.status(201).json({ success: true, data: application });
  } catch (error) {
    console.error('Application creation error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create application' }
    });
  }
});

// Get application by reference number (public)
router.get('/track/:referenceNumber', async (req: Request, res: Response) => {
  try {
    const { referenceNumber } = req.params;

    const application = await prisma.application.findUnique({
      where: { referenceNumber },
      select: {
        referenceNumber: true,
        fullName: true,
        status: true,
        applicationDate: true,
        reviewedAt: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        validFrom: true,
        validUntil: true
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found' }
      });
    }

    return res.json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve application' }
    });
  }
});

// Get all applications (officer/supervisor/director)
router.get('/', authMiddleware, roleMiddleware([UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.DIRECTOR]), async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where = status ? { status: status as ApplicationStatus } : {};

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { applicationDate: 'desc' },
        include: {
          assignedTo: { select: { fullName: true, email: true } },
          reviewedBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } }
        }
      }),
      prisma.application.count({ where })
    ]);

    return res.json({
      success: true,
      data: applications,
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
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve applications' }
    });
  }
});

// Get single application (officer/supervisor/director)
router.get('/:id', authMiddleware, roleMiddleware([UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.DIRECTOR]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        documents: true,
        assignedTo: { select: { fullName: true, email: true } },
        reviewedBy: { select: { fullName: true, email: true } },
        approvedBy: { select: { fullName: true, email: true } },
        rejectedBy: { select: { fullName: true, email: true } },
        entryExitLogs: { orderBy: { timestamp: 'desc' } }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found' }
      });
    }

    return res.json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve application' }
    });
  }
});

// Assign application (supervisor)
router.patch('/:id/assign', authMiddleware, roleMiddleware([UserRole.SUPERVISOR]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        assignedToId,
        status: ApplicationStatus.ASSIGNED
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'ASSIGN_APPLICATION',
        entityType: 'APPLICATION',
        entityId: id,
        details: { assignedToId }
      }
    });

    return res.json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to assign application' }
    });
  }
});

// Review application (officer)
router.patch('/:id/review', authMiddleware, roleMiddleware([UserRole.OFFICER]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { recommendation, notes } = req.body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.UNDER_REVIEW,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
        reviewNotes: notes
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'REVIEW_APPLICATION',
        entityType: 'APPLICATION',
        entityId: id,
        details: { recommendation, notes }
      }
    });

    return res.json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to review application' }
    });
  }
});

// Approve application (director)
router.patch('/:id/approve', authMiddleware, roleMiddleware([UserRole.DIRECTOR]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { validFrom, validUntil } = req.body;

    // Generate QR code
    const qrData = await generateQRCode(id);

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.APPROVED,
        approvedById: req.user!.id,
        approvedAt: new Date(),
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        qrCode: qrData.qrCode,
        qrSignature: qrData.signature
      },
      include: {
        assignedTo: true,
        reviewedBy: true
      }
    });

    // Send approval email with QR code
    await sendEmail({
      to: application.email,
      subject: 'KRG e-Visit Application Approved',
      html: `
        <h2>Application Approved</h2>
        <p>Dear ${application.fullName},</p>
        <p>Your e-Visit application has been approved!</p>
        <p><strong>Reference Number:</strong> ${application.referenceNumber}</p>
        <p><strong>Valid From:</strong> ${new Date(validFrom).toLocaleDateString()}</p>
        <p><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString()}</p>
        <p>Your QR code is attached. Please present it at the checkpoint.</p>
        <img src="${qrData.qrCode}" alt="QR Code" style="max-width: 300px;" />
        <p>Thank you for using KRG e-Visit System.</p>
      `
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'APPROVE_APPLICATION',
        entityType: 'APPLICATION',
        entityId: id,
        details: { validFrom, validUntil }
      }
    });

    return res.json({ success: true, data: application });
  } catch (error) {
    console.error('Approval error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to approve application' }
    });
  }
});

// Reject application (director)
router.patch('/:id/reject', authMiddleware, roleMiddleware([UserRole.DIRECTOR]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.REJECTED,
        rejectedById: req.user!.id,
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    });

    // Send rejection email
    await sendEmail({
      to: application.email,
      subject: 'KRG e-Visit Application Rejected',
      html: `
        <h2>Application Rejected</h2>
        <p>Dear ${application.fullName},</p>
        <p>We regret to inform you that your e-Visit application has been rejected.</p>
        <p><strong>Reference Number:</strong> ${application.referenceNumber}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You may submit a new application with corrected information.</p>
        <p>Thank you for using KRG e-Visit System.</p>
      `
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'REJECT_APPLICATION',
        entityType: 'APPLICATION',
        entityId: id,
        details: { reason }
      }
    });

    return res.json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to reject application' }
    });
  }
});

export default router;
