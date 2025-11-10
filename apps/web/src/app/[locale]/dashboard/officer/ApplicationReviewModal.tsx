'use client'

import { useState } from 'react'

interface Application {
  id: string
  referenceNumber: string
  fullName: string
  nationalId: string
  phoneNumber: string
  email: string | null
  dateOfBirth: string
  nationality: string
  originGovernorate: string
  destinationGovernorate: string
  visitPurpose: string
  visitStartDate: string
  visitEndDate: string
  declaredAccommodation: string | null
  status: string
  securityRiskScore: number
  securityFlags: string | null
  createdAt: string
  documents?: Array<{
    id: string
    documentType: string
    fileName: string
    fileUrl: string
    uploadedAt: string
  }>
}

interface ApplicationReviewModalProps {
  application: Application
  onClose: () => void
  onUpdate: () => void
}

export default function ApplicationReviewModal({
  application,
  onClose,
  onUpdate
}: ApplicationReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'security'>('details')
  const [loading, setLoading] = useState(false)
  const [showApproveForm, setShowApproveForm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionNotes, setRejectionNotes] = useState('')

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this application?')) return

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/applications/${application.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalNotes,
          officerId: 'officer-1' // In production, get from auth context
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Application approved successfully!')
        onUpdate()
        onClose()
      } else {
        alert('Error: ' + (data.error?.message || 'Failed to approve'))
      }
    } catch (error) {
      alert('Error approving application')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Please select a rejection reason')
      return
    }

    if (!confirm('Are you sure you want to reject this application?')) return

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/applications/${application.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason,
          rejectionNotes,
          officerId: 'officer-1'
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('❌ Application rejected')
        onUpdate()
        onClose()
      } else {
        alert('Error: ' + (data.error?.message || 'Failed to reject'))
      }
    } catch (error) {
      alert('Error rejecting application')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestDocuments = async () => {
    const docs = prompt('Enter required documents (comma-separated):')
    if (!docs) return

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/applications/${application.id}/request-documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedDocuments: docs,
          notes: 'Please upload the requested documents',
          officerId: 'officer-1'
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('📄 Document request sent')
        onUpdate()
        onClose()
      } else {
        alert('Error: ' + (data.error?.message || 'Failed to request documents'))
      }
    } catch (error) {
      alert('Error requesting documents')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 50) return 'text-orange-600'
    if (score >= 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'CRITICAL'
    if (score >= 50) return 'HIGH'
    if (score >= 30) return 'MEDIUM'
    return 'LOW'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start bg-gray-50">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{application.fullName}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                application.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                application.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                application.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {application.status}
              </span>
            </div>
            <p className="text-gray-600 font-mono">{application.referenceNumber}</p>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Risk: <span className={`font-bold ${getRiskColor(application.securityRiskScore)}`}>
                  {application.securityRiskScore}/100 ({getRiskLabel(application.securityRiskScore)})
                </span>
              </span>
              <span className="text-gray-600">
                Submitted: {new Date(application.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Details
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeTab === 'documents'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📎 Documents ({application.documents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeTab === 'security'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🛡️ Security
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Full Name</label>
                    <p className="font-medium">{application.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">National ID</label>
                    <p className="font-medium font-mono">{application.nationalId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Date of Birth</label>
                    <p className="font-medium">{new Date(application.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Nationality</label>
                    <p className="font-medium">{application.nationality}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone Number</label>
                    <p className="font-medium font-mono">{application.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium">{application.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Visit Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Origin</label>
                    <p className="font-medium">{application.originGovernorate}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Destination</label>
                    <p className="font-medium">{application.destinationGovernorate}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Purpose</label>
                    <p className="font-medium">{application.visitPurpose}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Duration</label>
                    <p className="font-medium">
                      {new Date(application.visitStartDate).toLocaleDateString()} → {new Date(application.visitEndDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">Declared Accommodation</label>
                    <p className="font-medium">{application.declaredAccommodation || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              {!application.documents || application.documents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {application.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-gray-600">{doc.documentType}</p>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Assessment</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700">Risk Score</span>
                    <span className={`text-3xl font-bold ${getRiskColor(application.securityRiskScore)}`}>
                      {application.securityRiskScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        application.securityRiskScore >= 80 ? 'bg-red-600' :
                        application.securityRiskScore >= 50 ? 'bg-orange-500' :
                        application.securityRiskScore >= 30 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${application.securityRiskScore}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Risk Level: <strong className={getRiskColor(application.securityRiskScore)}>
                      {getRiskLabel(application.securityRiskScore)}
                    </strong>
                  </p>
                </div>
              </div>

              {application.securityFlags && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Security Flags</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">{application.securityFlags}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Checks Performed</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Watchlist check completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Duplicate detection completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Recent rejection check completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Overstay history check completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Suspicious pattern check completed</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t p-6 bg-gray-50 space-y-4">
          {!showApproveForm && !showRejectForm && (
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleRequestDocuments}
                disabled={loading}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium disabled:opacity-50"
              >
                📄 Request Documents
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                ❌ Reject
              </button>
              <button
                onClick={() => setShowApproveForm(true)}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
                ✅ Approve
              </button>
            </div>
          )}

          {showApproveForm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-green-900">Approve Application</h4>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Optional approval notes..."
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowApproveForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          )}

          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-red-900">Reject Application</h4>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select rejection reason...</option>
                <option value="INVALID_DOCUMENTS">Invalid or incomplete documents</option>
                <option value="SECURITY_CONCERN">Security concern</option>
                <option value="FRAUDULENT">Fraudulent application</option>
                <option value="DUPLICATE">Duplicate application</option>
                <option value="INELIGIBLE">Visitor ineligible</option>
                <option value="OTHER">Other reason</option>
              </select>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Additional notes (optional)..."
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
