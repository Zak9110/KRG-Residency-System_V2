# 📡 KRG e-Visit API Reference

## Base URL
```
Development: http://localhost:3001
Production: https://api.krg-evisit.gov.iq
```

---

## 🔐 Authentication

Most endpoints require JWT authentication. Include in headers:
```
Authorization: Bearer <jwt_token>
```

Public endpoints (no auth required):
- `POST /api/applications` - Submit application
- `POST /api/otp/send` - Send OTP
- `POST /api/otp/verify` - Verify OTP
- `GET /health` - Health check

---

## 📋 Applications API

### Submit Application (Public)
```http
POST /api/applications
Content-Type: application/json

{
  "fullName": "Ahmed Hassan",
  "nationalId": "1234567890",
  "phoneNumber": "+9647501234567",
  "email": "ahmed@example.com",
  "dateOfBirth": "1990-01-15",
  "nationality": "Iraq",
  "originGovernorate": "Baghdad",
  "destinationGovernorate": "Erbil",
  "visitPurpose": "TOURISM",
  "visitStartDate": "2025-12-01",
  "visitEndDate": "2025-12-15",
  "declaredAccommodation": "Hotel ABC, Erbil"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "referenceNumber": "KRG-2025-001234",
    "status": "SUBMITTED",
    "securityRiskScore": 15,
    "securityFlags": [],
    "createdAt": "2025-11-09T10:30:00Z"
  },
  "message": "Application submitted successfully"
}
```

---

## 📁 File Upload API

### Upload Documents
```http
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <token> (optional for applicants)

Form Data:
- files: [File] (Max 5 files, 10MB each)
- applicationId: string
- documentType: NATIONAL_ID | PASSPORT | SUPPORTING_DOC | VISITOR_PHOTO
```

**Example (curl):**
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "files=@/path/to/national-id.jpg" \
  -F "files=@/path/to/passport.jpg" \
  -F "applicationId=your-app-id" \
  -F "documentType=NATIONAL_ID"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "id": "doc-uuid",
        "fileUrl": "https://supabase.co/storage/...",
        "fileName": "national-id.jpg",
        "fileSize": 2048576,
        "mimeType": "image/jpeg",
        "documentType": "NATIONAL_ID",
        "uploadedAt": "2025-11-09T10:35:00Z"
      }
    ],
    "errors": []
  },
  "message": "Successfully uploaded 1 of 1 files"
}
```

### Get Application Documents
```http
GET /api/upload/:applicationId
```

### Delete Document
```http
DELETE /api/upload/:documentId
Authorization: Bearer <token>
```

---

## 📱 OTP Verification API

### Send OTP
```http
POST /api/otp/send
Content-Type: application/json

{
  "phoneNumber": "+9647501234567",
  "purpose": "APPLICATION",
  "applicationId": "uuid" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresAt": "2025-11-09T10:45:00Z",
    "otp": "123456" (dev only)
  }
}
```

**Rate Limit:** 1 request per 60 seconds per phone number

### Verify OTP
```http
POST /api/otp/verify
Content-Type: application/json

{
  "phoneNumber": "+9647501234567",
  "otpCode": "123456",
  "purpose": "APPLICATION"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "data": {
    "phoneNumber": "+9647501234567",
    "verified": true
  }
}
```

**Note:** Max 3 attempts per OTP. After 3 failed attempts, request new OTP.

### Resend OTP
```http
POST /api/otp/resend
Content-Type: application/json

{
  "phoneNumber": "+9647501234567",
  "purpose": "APPLICATION"
}
```

---

## 🔒 Security Screening (Internal)

Used automatically on application submission. Can also be called manually:

```javascript
import { runSecurityScreening } from './services/security';

const result = await runSecurityScreening(
  nationalId,
  phoneNumber,
  fullName,
  applicationId
);

// Result:
{
  riskScore: 35,
  flags: ["DUPLICATE: Application KRG-2025-001233 already exists"],
  severity: "MEDIUM",
  passed: true,
  requiresSupervisorReview: false,
  requiresManualReview: true,
  details: {
    watchlistMatch: false,
    duplicateApplication: true,
    recentRejection: false,
    overstayHistory: false,
    suspiciousPattern: false
  }
}
```

**Risk Score Ranges:**
- 0-29: LOW (auto-approve eligible)
- 30-49: MEDIUM (manual review)
- 50-79: HIGH (supervisor review)
- 80-100: CRITICAL (auto-reject or senior approval)

---

## 📧 WhatsApp Notifications (Internal)

```javascript
import { 
  sendApplicationSubmittedWhatsApp,
  sendApplicationApprovedWhatsApp,
  sendApplicationRejectedWhatsApp,
  sendExpiryReminderWhatsApp,
  sendEntryRecordedWhatsApp
} from './services/whatsapp';

// Send approval notification
await sendApplicationApprovedWhatsApp(
  phoneNumber: "+9647501234567",
  referenceNumber: "KRG-2025-001234",
  fullName: "Ahmed Hassan",
  qrCodeUrl: "https://...",
  expiryDate: "December 15, 2025"
);
```

---

## 🎫 Checkpoint API (Coming Soon)

### Verify QR Code
```http
POST /api/checkpoint/verify
Content-Type: application/json
Authorization: Bearer <checkpoint_officer_token>

{
  "qrCode": "encrypted-qr-data",
  "checkpointName": "Erbil Checkpoint"
}
```

### Record Entry
```http
POST /api/checkpoint/entry
Content-Type: application/json
Authorization: Bearer <checkpoint_officer_token>

{
  "applicationId": "uuid",
  "checkpointName": "Erbil Checkpoint",
  "officerId": "officer-uuid",
  "visitorPhotoUrl": "https://...",
  "vehiclePlateNumber": "ABC-1234"
}
```

### Record Exit
```http
POST /api/checkpoint/exit
Content-Type: application/json
Authorization: Bearer <checkpoint_officer_token>

{
  "applicationId": "uuid",
  "checkpointName": "Erbil Checkpoint",
  "officerId": "officer-uuid"
}
```

---

## 🔄 Renewal API (Coming Soon)

### Submit Renewal Request
```http
POST /api/applications/:id/renew
Content-Type: application/json

{
  "renewalType": "STANDARD",
  "newVisitEndDate": "2026-01-15",
  "justification": "Need to extend visit for business"
}
```

---

## 📢 Appeal API (Coming Soon)

### Submit Appeal
```http
POST /api/applications/:id/appeal
Content-Type: application/json

{
  "appealReason": "Documents were valid but misunderstood",
  "additionalDocuments": ["url1", "url2"]
}
```

---

## 📊 Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error

---

## 🧪 Testing with curl (PowerShell)

### Submit Application
```powershell
curl.exe -X POST http://localhost:3001/api/applications `
  -H "Content-Type: application/json" `
  -d '{\"fullName\":\"Ahmed Hassan\",\"nationalId\":\"1234567890\",\"phoneNumber\":\"+9647501234567\",\"dateOfBirth\":\"1990-01-15\",\"nationality\":\"Iraq\",\"originGovernorate\":\"Baghdad\",\"destinationGovernorate\":\"Erbil\",\"visitPurpose\":\"TOURISM\",\"visitStartDate\":\"2025-12-01\",\"visitEndDate\":\"2025-12-15\"}'
```

### Upload File
```powershell
curl.exe -X POST http://localhost:3001/api/upload `
  -F "files=@C:\path\to\file.jpg" `
  -F "applicationId=your-app-id" `
  -F "documentType=NATIONAL_ID"
```

### Send OTP
```powershell
curl.exe -X POST http://localhost:3001/api/otp/send `
  -H "Content-Type: application/json" `
  -d '{\"phoneNumber\":\"+9647501234567\",\"purpose\":\"APPLICATION\"}'
```

### Verify OTP
```powershell
curl.exe -X POST http://localhost:3001/api/otp/verify `
  -H "Content-Type: application/json" `
  -d '{\"phoneNumber\":\"+9647501234567\",\"otpCode\":\"123456\",\"purpose\":\"APPLICATION\"}'
```

---

## 🔍 Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": "Additional context"
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource doesn't exist
- `UNAUTHORIZED` - Authentication required
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `DUPLICATE_APPLICATION` - Application already exists
- `SECURITY_FLAG` - Security concern detected

---

## 📖 Useful Resources

- **Twilio WhatsApp Docs**: https://www.twilio.com/docs/whatsapp
- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **Prisma Client Docs**: https://www.prisma.io/docs/concepts/components/prisma-client

---

**Last Updated:** November 9, 2025  
**API Version:** 1.0.0-beta  
**Status:** Development 🚧
