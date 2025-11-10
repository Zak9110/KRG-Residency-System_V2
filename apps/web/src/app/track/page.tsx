'use client'

import { useState } from 'react'

interface Application {
  id: string
  referenceNumber: string
  fullName: string
  status: string
  createdAt: string
  approvalDate: string | null
  rejectionDate: string | null
  rejectionReason: string | null
  qrCode: string | null
  visitStartDate: string
  visitEndDate: string
  permitExpiryDate: string | null
  documents: Array<{
    id: string
    documentType: string
    fileName: string
    fileUrl: string
  }>
}

export default function TrackApplicationPage() {
  const [referenceNumber, setReferenceNumber] = useState('')
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!referenceNumber.trim()) {
      setError('Please enter a reference number')
      return
    }

    setLoading(true)
    setError('')
    setApplication(null)

    try {
      const response = await fetch(`http://localhost:3001/api/applications?ref=${referenceNumber}`)
      const data = await response.json()

      if (data.success && data.data.length > 0) {
        setApplication(data.data[0])
      } else {
        setError('Application not found. Please check your reference number.')
      }
    } catch (err) {
      setError('Failed to fetch application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'PENDING_DOCUMENTS': return 'bg-orange-100 text-orange-800'
      case 'ACTIVE': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return '📝'
      case 'UNDER_REVIEW': return '🔍'
      case 'APPROVED': return '✅'
      case 'REJECTED': return '❌'
      case 'PENDING_DOCUMENTS': return '📄'
      case 'ACTIVE': return '🟢'
      default: return '⏳'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Application</h1>
          <p className="text-gray-600">Enter your reference number to check your application status</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g., KRG-2025-000001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : '🔍 Track Application'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Application Details */}
        {application && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Status Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{application.fullName}</h2>
                  <p className="text-green-100 font-mono">{application.referenceNumber}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg ${getStatusColor(application.status)} text-lg font-semibold`}>
                  {getStatusIcon(application.status)} {application.status.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h3>
              <div className="space-y-4">
                {/* Submitted */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Application Submitted</p>
                    <p className="text-sm text-gray-600">
                      {new Date(application.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Under Review */}
                {['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE'].includes(application.status) && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Under Review</p>
                      <p className="text-sm text-gray-600">Being processed by immigration officer</p>
                    </div>
                  </div>
                )}

                {/* Approved */}
                {application.status === 'APPROVED' && application.approvalDate && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Application Approved</p>
                      <p className="text-sm text-gray-600">
                        {new Date(application.approvalDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejected */}
                {application.status === 'REJECTED' && application.rejectionDate && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                      ✕
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Application Rejected</p>
                      <p className="text-sm text-gray-600">
                        {new Date(application.rejectionDate).toLocaleString()}
                      </p>
                      {application.rejectionReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {application.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visit Details */}
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Visit Start Date</p>
                  <p className="font-medium">{new Date(application.visitStartDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Visit End Date</p>
                  <p className="font-medium">{new Date(application.visitEndDate).toLocaleDateString()}</p>
                </div>
                {application.permitExpiryDate && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Permit Valid Until</p>
                    <p className="font-medium text-green-600">
                      {new Date(application.permitExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code - Only show if approved */}
            {application.status === 'APPROVED' && application.qrCode && (
              <div className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Your Digital Permit
                </h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                      <p className="text-sm text-gray-500 text-center">
                        QR Code<br />
                        {application.qrCode}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center max-w-md">
                    Show this QR code at checkpoints for entry verification
                  </p>
                  <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                    📥 Download Permit
                  </button>
                </div>
              </div>
            )}

            {/* Documents */}
            {application.documents && application.documents.length > 0 && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                <div className="space-y-2">
                  {application.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-sm text-gray-600">{doc.documentType}</p>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Documents Notice */}
            {application.status === 'PENDING_DOCUMENTS' && (
              <div className="p-6 bg-orange-50 border-t border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  📄 Additional Documents Required
                </h3>
                <p className="text-orange-700 mb-4">
                  Please upload the requested documents to continue processing your application.
                </p>
                <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition">
                  Upload Documents
                </button>
              </div>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
