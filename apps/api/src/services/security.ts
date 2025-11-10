import { PrismaClient } from '@krg-evisit/database';

const prisma = new PrismaClient();

/**
 * Security risk score calculation result
 */
export interface SecurityCheckResult {
  riskScore: number; // 0-100
  flags: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  passed: boolean;
  requiresSupervisorReview: boolean;
  requiresManualReview: boolean;
  details: {
    watchlistMatch?: boolean;
    duplicateApplication?: boolean;
    recentRejection?: boolean;
    overstayHistory?: boolean;
    suspiciousPattern?: boolean;
  };
}

/**
 * Run comprehensive security screening on an application
 */
export async function runSecurityScreening(
  nationalId: string,
  phoneNumber: string,
  fullName: string,
  applicationId?: string
): Promise<SecurityCheckResult> {
  let riskScore = 0;
  const flags: string[] = [];
  const details: SecurityCheckResult['details'] = {};

  // ================================================================
  // CHECK 1: Internal Watchlist
  // ================================================================
  const watchlistMatch = await prisma.internalWatchlist.findFirst({
    where: {
      nationalId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    },
  });

  if (watchlistMatch) {
    details.watchlistMatch = true;
    flags.push(`WATCHLIST: ${watchlistMatch.flagType} - ${watchlistMatch.reason}`);
    
    switch (watchlistMatch.severity) {
      case 'CRITICAL':
        riskScore += 80;
        break;
      case 'HIGH':
        riskScore += 50;
        break;
      case 'MEDIUM':
        riskScore += 30;
        break;
      case 'LOW':
        riskScore += 15;
        break;
    }
  }

  // ================================================================
  // CHECK 2: Duplicate Applications (Within 7 days)
  // ================================================================
  const duplicateApp = await prisma.application.findFirst({
    where: {
      nationalId,
      id: { not: applicationId }, // Exclude current application
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
      status: {
        in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE'],
      },
    },
  });

  if (duplicateApp) {
    details.duplicateApplication = true;
    flags.push(`DUPLICATE: Application ${duplicateApp.referenceNumber} already exists`);
    riskScore += 40;
  }

  // ================================================================
  // CHECK 3: Recent Rejections (Within 30 days)
  // ================================================================
  const recentRejection = await prisma.application.findFirst({
    where: {
      nationalId,
      status: 'REJECTED',
      rejectionDate: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    orderBy: {
      rejectionDate: 'desc',
    },
  });

  if (recentRejection) {
    details.recentRejection = true;
    flags.push(`RECENT_REJECTION: Rejected on ${recentRejection.rejectionDate?.toLocaleDateString()}`);
    riskScore += 25;
  }

  // ================================================================
  // CHECK 4: Overstay History
  // ================================================================
  const overstayHistory = await prisma.application.findFirst({
    where: {
      nationalId,
      overstayDays: {
        gt: 7, // More than 7 days overstay
      },
    },
  });

  if (overstayHistory) {
    details.overstayHistory = true;
    flags.push(`OVERSTAY_HISTORY: ${overstayHistory.overstayDays} days overstay`);
    riskScore += 35;
  }

  // ================================================================
  // CHECK 5: Suspicious Pattern Detection
  // ================================================================
  // Check for multiple applications with same phone but different IDs
  const samePhoneApps = await prisma.application.findMany({
    where: {
      phoneNumber,
      nationalId: { not: nationalId },
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  if (samePhoneApps.length >= 3) {
    details.suspiciousPattern = true;
    flags.push(`SUSPICIOUS: ${samePhoneApps.length} different IDs using same phone`);
    riskScore += 30;
  }

  // ================================================================
  // CALCULATE FINAL SCORE & SEVERITY
  // ================================================================
  // Cap at 100
  riskScore = Math.min(riskScore, 100);

  let severity: SecurityCheckResult['severity'];
  let passed = true;
  let requiresSupervisorReview = false;
  let requiresManualReview = false;

  if (riskScore >= 80) {
    severity = 'CRITICAL';
    passed = false;
    requiresSupervisorReview = true;
    requiresManualReview = true;
  } else if (riskScore >= 50) {
    severity = 'HIGH';
    passed = false;
    requiresSupervisorReview = true;
    requiresManualReview = true;
  } else if (riskScore >= 30) {
    severity = 'MEDIUM';
    passed = true; // Can proceed but flagged
    requiresSupervisorReview = false;
    requiresManualReview = true;
  } else {
    severity = 'LOW';
    passed = true;
    requiresSupervisorReview = false;
    requiresManualReview = false;
  }

  return {
    riskScore,
    flags,
    severity,
    passed,
    requiresSupervisorReview,
    requiresManualReview,
    details,
  };
}

/**
 * Add entry to internal watchlist
 */
export async function addToWatchlist(
  nationalId: string,
  fullName: string,
  reason: string,
  flagType: 'OVERSTAY' | 'FRAUD' | 'SECURITY_CONCERN' | 'DUPLICATE',
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  expiresAt?: Date,
  createdBy?: string
): Promise<void> {
  await prisma.internalWatchlist.create({
    data: {
      nationalId,
      fullName,
      reason,
      flagType,
      severity,
      expiresAt: expiresAt || null,
      createdBy: createdBy || null,
    },
  });

  console.log(`⚠️  Added to watchlist: ${nationalId} - ${flagType}`);
}

/**
 * Remove from watchlist (deactivate)
 */
export async function removeFromWatchlist(
  nationalId: string,
  flagType?: string
): Promise<void> {
  const where: any = {
    nationalId,
    isActive: true,
  };

  if (flagType) {
    where.flagType = flagType;
  }

  await prisma.internalWatchlist.updateMany({
    where,
    data: {
      isActive: false,
    },
  });

  console.log(`✅ Removed from watchlist: ${nationalId}`);
}

/**
 * Check if visitor is in watchlist
 */
export async function checkWatchlist(nationalId: string): Promise<boolean> {
  const match = await prisma.internalWatchlist.findFirst({
    where: {
      nationalId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    },
  });

  return !!match;
}

/**
 * Automatically detect and handle overstays
 */
export async function detectAndFlagOverstays(): Promise<void> {
  // Find expired permits that haven't exited
  const overstayedApplications = await prisma.application.findMany({
    where: {
      status: 'ACTIVE',
      permitExpiryDate: {
        lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // More than 3 days past expiry
      },
      exitTimestamp: null,
    },
  });

  console.log(`🔍 Found ${overstayedApplications.length} overstayed applications`);

  for (const app of overstayedApplications) {
    const overstayDays = Math.floor(
      (Date.now() - (app.permitExpiryDate?.getTime() || Date.now())) / (24 * 60 * 60 * 1000)
    );

    // Update application
    await prisma.application.update({
      where: { id: app.id },
      data: {
        status: 'OVERSTAYED',
        overstayDays,
      },
    });

    // Add to watchlist if significant overstay
    if (overstayDays > 7) {
      const severity = overstayDays > 30 ? 'HIGH' : overstayDays > 14 ? 'MEDIUM' : 'LOW';
      
      await addToWatchlist(
        app.nationalId,
        app.fullName,
        `Overstayed by ${overstayDays} days`,
        'OVERSTAY',
        severity,
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // Expire in 6 months
      );
    }

    console.log(`⚠️  Flagged overstay: ${app.referenceNumber} (${overstayDays} days)`);
  }
}
