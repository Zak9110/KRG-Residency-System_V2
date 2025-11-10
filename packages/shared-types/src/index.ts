// ===================================================================
// ENUMS
// ===================================================================

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_DOCUMENTS = 'PENDING_DOCUMENTS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PERMIT_ISSUED = 'PERMIT_ISSUED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  EXITED = 'EXITED'
}

export enum UserRole {
  OFFICER = 'OFFICER',
  SUPERVISOR = 'SUPERVISOR',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN'
}

export enum VisitPurpose {
  TOURISM = 'TOURISM',
  BUSINESS = 'BUSINESS',
  FAMILY_VISIT = 'FAMILY_VISIT',
  MEDICAL = 'MEDICAL',
  EDUCATION = 'EDUCATION',
  OTHER = 'OTHER'
}

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  NATIONAL_ID = 'NATIONAL_ID',
  ACCOMMODATION_PROOF = 'ACCOMMODATION_PROOF',
  OTHER = 'OTHER'
}

export enum PriorityLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// ===================================================================
// INTERFACES
// ===================================================================

export interface Application {
  id: string;
  referenceNumber: string;
  
  // Visitor Information
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: Date;
  nationality: string;
  
  // Visit Details
  originGovernorate: string;
  destinationGovernorate: string;
  visitPurpose: VisitPurpose;
  visitStartDate: Date;
  visitEndDate: Date;
  declaredAccommodation?: string;
  
  // Processing
  status: ApplicationStatus;
  assignedOfficerId?: string;
  priorityLevel: PriorityLevel;
  
  // Decisions
  approvalDate?: Date;
  rejectionDate?: Date;
  rejectionReason?: string;
  
  // Entry/Exit
  entryTimestamp?: Date;
  exitTimestamp?: Date;
  qrCode?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface Document {
  id: string;
  applicationId: string;
  documentType: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface EntryExitLog {
  id: string;
  applicationId: string;
  logType: 'ENTRY' | 'EXIT';
  checkpointName: string;
  officerId?: string;
  recordedAt: Date;
  notes?: string;
}

// ===================================================================
// API TYPES
// ===================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ===================================================================
// FORM DATA TYPES
// ===================================================================

export interface ApplicationFormData {
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: string;
  nationality: string;
  originGovernorate: string;
  destinationGovernorate: string;
  visitPurpose: VisitPurpose;
  visitStartDate: string;
  visitEndDate: string;
  declaredAccommodation?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApprovalDecision {
  applicationId: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO';
  reason?: string;
  notes?: string;
}

export interface QRPayload {
  v: string; // version
  ref: string; // reference number
  appId: string;
  name: string;
  exp: string; // expiry date
  sig: string; // signature
}

// ===================================================================
// CONSTANTS
// ===================================================================

export const GOVERNORATES = {
  IRAQ: [
    'Baghdad',
    'Basra',
    'Najaf',
    'Karbala',
    'Babylon',
    'Anbar',
    'Diyala',
    'Wasit',
    'Saladin',
    'Nineveh',
    'Kirkuk',
    'Dhi Qar',
    'Maysan',
    'Al-Qādisiyyah',
    'Muthanna'
  ],
  KRG: [
    'Erbil',
    'Sulaymaniyah',
    'Duhok',
    'Halabja'
  ]
};

export const VISIT_PURPOSES = [
  { value: 'TOURISM', label: { en: 'Tourism', ar: 'سياحة' } },
  { value: 'BUSINESS', label: { en: 'Business', ar: 'عمل' } },
  { value: 'FAMILY_VISIT', label: { en: 'Family Visit', ar: 'زيارة عائلية' } },
  { value: 'MEDICAL', label: { en: 'Medical', ar: 'طبي' } },
  { value: 'EDUCATION', label: { en: 'Education', ar: 'تعليم' } },
  { value: 'OTHER', label: { en: 'Other', ar: 'أخرى' } }
];
