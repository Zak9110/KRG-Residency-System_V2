'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ApplicationReviewModal from './ApplicationReviewModal'

// Check authentication
function useAuth() {
  const router = useRouter()
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      router.push('/login')
      return
    }
    
    const userData = JSON.parse(user)
    if (userData.role !== 'OFFICER' && userData.role !== 'SUPERVISOR' && userData.role !== 'DIRECTOR') {
      router.push('/login')
    }
  }, [router])
}

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
  priorityLevel: string
  securityRiskScore: number
  securityFlags: string | null
  createdAt: string
  processingDeadline: string | null
  documents?: Array<{
    id: string
    documentType: string
    fileName: string
    fileUrl: string
    uploadedAt: string
  }>
}

export default function OfficerDashboard() {
  useAuth() // Check authentication
  
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [stats, setStats] = useState({
    pending: 0,
    processed: 0,
    today: 0
  })

  useEffect(() => {
    fetchApplications()
    const interval = setInterval(fetchApplications, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [filter])

  const fetchApplications = async () => {
    try {
      // In production, this would use JWT from localStorage
      // For now, we'll fetch all applications
      const response = await fetch('http://localhost:3001/api/applications')
      const data = await response.json()

      if (data.success) {
        const apps = data.data as Application[]
        setApplications(apps)
        
        // Calculate stats
        const pending = apps.filter(a => 
          a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
        ).length
        const processed = apps.filter(a => 
          a.status === 'APPROVED' || a.status === 'REJECTED'
        ).length
        const today = apps.filter(a => {
          const created = new Date(a.createdAt)
          const now = new Date()
          return created.toDateString() === now.toDateString()
        }).length

        setStats({ pending, processed, today })
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredApplications = () => {
    switch (filter) {
      case 'pending':
        return applications.filter(a => 
          a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
        )
      case 'urgent':
        return applications.filter(a => a.priorityLevel === 'URGENT')
      case 'high-risk':
        return applications.filter(a => a.securityRiskScore >= 50)
      default:
        return applications
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUBMITTED: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      PENDING_DOCUMENTS: 'bg-orange-100 text-orange-800',
      ACTIVE: 'bg-purple-100 text-purple-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 font-bold'
    if (score >= 50) return 'text-orange-600 font-semibold'
    if (score >= 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null
    const now = new Date()
    const end = new Date(deadline)
    const hours = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (hours < 0) return <span className="text-red-600 font-bold">OVERDUE</span>
    if (hours < 12) return <span className="text-red-600">{hours}h remaining</span>
    if (hours < 24) return <span className="text-orange-600">{hours}h remaining</span>
    return <span className="text-gray-600">{Math.floor(hours / 24)}d remaining</span>
  }

  const filteredApps = getFilteredApplications()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Officer Dashboard</h1>
              <p className="text-sm text-gray-600">Application Processing Queue</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-semibold">
                  {(() => {
                    const user = localStorage.getItem('user')
                    return user ? JSON.parse(user).fullName : 'Officer'
                  })()}
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  router.push('/login')
                }}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.processed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted Today</p>
                <p className="text-3xl font-bold text-purple-600">{stats.today}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Applications ({applications.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'urgent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔴 Urgent
            </button>
            <button
              onClick={() => setFilter('high-risk')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'high-risk'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚠️ High Risk
            </button>
          </div>
        </div>

        {/* Applications Queue */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Application Queue ({filteredApps.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading applications...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No applications found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {app.fullName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                        {app.priorityLevel === 'URGENT' && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                            🔴 URGENT
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Reference</p>
                          <p className="font-mono font-medium">{app.referenceNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">National ID</p>
                          <p className="font-medium">{app.nationalId}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">From → To</p>
                          <p className="font-medium">{app.originGovernorate} → {app.destinationGovernorate}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Purpose</p>
                          <p className="font-medium">{app.visitPurpose}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Risk Score:</span>
                          <span className={`font-bold ${getRiskColor(app.securityRiskScore)}`}>
                            {app.securityRiskScore}/100
                          </span>
                        </div>
                        {app.processingDeadline && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Deadline:</span>
                            {getTimeRemaining(app.processingDeadline)}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Submitted:</span>
                          <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedApp(app)
                      }}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Review Modal */}
      {selectedApp && (
        <ApplicationReviewModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={fetchApplications}
        />
      )}
    </div>
  )
}
