'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Users,
  FileText,
  AlertTriangle,
  Settings,
  RefreshCw,
  UserCheck,
  Clock,
  Shield,
  Plus,
  Trash2,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SupervisorData {
  summary: {
    totalApplications: number;
    unassignedApplications: number;
    totalOfficers: number;
    watchlistMatches: number;
    statusBreakdown: Record<string, number>;
  };
  officerWorkload: Array<{
    officer: {
      id: string;
      name: string;
      email: string;
      lastLogin: string | null;
    };
    stats: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      avgProcessingHours: number;
      efficiency: number;
    };
  }>;
  recentAssignments: Array<{
    id: string;
    referenceNumber: string;
    applicant: string;
    officer: string;
    status: string;
    assignedAt: string;
    createdAt: string;
  }>;
  activeOfficers: number;
}

interface WatchlistEntry {
  id: string;
  nationalId: string;
  fullName: string;
  reason: string;
  flagType: string;
  severity: string;
  isActive: boolean;
  createdAt: string;
}

type Section = 'overview' | 'workload' | 'assignments' | 'watchlist' | 'settings';

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#3b82f6',
  UNDER_REVIEW: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  ACTIVE: '#8b5cf6',
  PENDING_DOCUMENTS: '#f59e0b',
};

export default function SupervisorDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [data, setData] = useState<SupervisorData | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const [newEntry, setNewEntry] = useState({
    nationalId: '',
    fullName: '',
    reason: '',
    flagType: 'SECURITY_CONCERN',
    severity: 'MEDIUM',
  });

  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [assignmentAlgorithm, setAssignmentAlgorithm] = useState('round-robin');
  const [maxApplicationsPerOfficer, setMaxApplicationsPerOfficer] = useState(10);

  useEffect(() => {
    fetchData();
    fetchAutoAssignConfig();
    const interval = autoRefresh ? setInterval(fetchData, 30000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/en/login');
        return;
      }

      const [supervisorRes, watchlistRes] = await Promise.all([
        fetch('http://localhost:3001/api/analytics/supervisor', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/watchlist', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (supervisorRes.ok) {
        const result = await supervisorRes.json();
        setData(result.data);
      }

      if (watchlistRes.ok) {
        const watchlistData = await watchlistRes.json();
        setWatchlist(watchlistData.filter((e: WatchlistEntry) => e.isActive));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoAssignConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/auto-assign/config', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAutoAssignEnabled(result.data.enabled);
          setAssignmentAlgorithm(result.data.algorithm);
          setMaxApplicationsPerOfficer(result.data.maxApplicationsPerOfficer);
        }
      }
    } catch (error) {
      console.error('Error fetching auto-assign config:', error);
    }
  };

  const saveAutoAssignSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/auto-assign/config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: autoAssignEnabled,
          algorithm: assignmentAlgorithm,
          maxApplicationsPerOfficer,
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    }
  };

  const triggerAutoAssignment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/auto-assign/trigger', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Auto-assignment complete! Assigned ${result.data.assigned} of ${result.data.total} applications`);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error?.message || 'Failed to trigger auto-assignment');
      }
    } catch (error) {
      console.error('Error triggering auto-assignment:', error);
      alert('Error triggering auto-assignment');
    }
  };

  const handleAddWatchlistEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEntry),
      });

      if (response.ok) {
        setNewEntry({
          nationalId: '',
          fullName: '',
          reason: '',
          flagType: 'SECURITY_CONCERN',
          severity: 'MEDIUM',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding watchlist entry:', error);
    }
  };

  const handleRemoveWatchlistEntry = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/watchlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error removing watchlist entry:', error);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const statusChartData = Object.entries(data.summary.statusBreakdown).map(([status, count]) => ({
    status,
    count,
    color: STATUS_COLORS[status] || '#6b7280',
  }));

  const workloadChartData = data.officerWorkload.map((item) => ({
    name: item.officer.name.split(' ')[0],
    total: item.stats.total,
    pending: item.stats.pending,
    approved: item.stats.approved,
    rejected: item.stats.rejected,
  }));

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-64 bg-white shadow-xl border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Supervisor</h1>
          <p className="text-sm text-gray-500 mt-1">Management Portal</p>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: 'overview' as Section, icon: Activity, label: 'Overview' },
            { id: 'workload' as Section, icon: Users, label: 'Officer Workload' },
            { id: 'assignments' as Section, icon: FileText, label: 'Assignments' },
            { id: 'watchlist' as Section, icon: AlertTriangle, label: 'Watchlist' },
            { id: 'settings' as Section, icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeSection === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'}`}>
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
          <button onClick={fetchData} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <RefreshCw size={16} />
            <span className="text-sm">Refresh Data</span>
          </button>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
            <button onClick={() => setAutoRefresh(!autoRefresh)} className="text-blue-600 hover:underline">Toggle</button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Overview</h2>
                <p className="text-gray-600 mt-1">Real-time system metrics and status</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Applications</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{data.summary.totalApplications}</p>
                    </div>
                    <FileText className="text-blue-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Unassigned</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{data.summary.unassignedApplications}</p>
                    </div>
                    <Clock className="text-orange-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Officers</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{data.activeOfficers}</p>
                    </div>
                    <UserCheck className="text-green-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Watchlist Matches</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{data.summary.watchlistMatches}</p>
                    </div>
                    <Shield className="text-red-500" size={40} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="mr-2" />Application Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="status" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeSection === 'workload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Officer Workload</h2>
                <p className="text-gray-600 mt-1">Monitor officer performance and capacity</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Workload Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workloadChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="approved" fill="#10b981" name="Approved" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="rejected" fill="#ef4444" name="Rejected" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Officer Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Officer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejected</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.officerWorkload.map((item) => (
                        <tr key={item.officer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900">{item.officer.name}</div>
                              <div className="text-sm text-gray-500">{item.officer.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.stats.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{item.stats.pending}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.stats.approved}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.stats.rejected}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stats.avgProcessingHours.toFixed(1)}h</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(item.stats.efficiency, 100)}%` }}></div>
                              </div>
                              <span className="text-sm text-gray-900 font-medium">{item.stats.efficiency.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'assignments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Recent Assignments</h2>
                <p className="text-gray-600 mt-1">Track application assignments to officers</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Officer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned At</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.recentAssignments.length > 0 ? (
                        data.recentAssignments.map((assignment) => (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{assignment.referenceNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.applicant}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.officer}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                                style={{ backgroundColor: STATUS_COLORS[assignment.status] + '20', color: STATUS_COLORS[assignment.status] }}>
                                {assignment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(assignment.assignedAt).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No assignments yet. Assignments will appear here once applications are assigned to officers.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'watchlist' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Security Watchlist</h2>
                <p className="text-gray-600 mt-1">Manage suspicious persons and security flags</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="mr-2" />Add Watchlist Entry
                </h3>
                <form onSubmit={handleAddWatchlistEntry} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                      <input type="text" required value={newEntry.nationalId}
                        onChange={(e) => setNewEntry({ ...newEntry, nationalId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter National ID" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" required value={newEntry.fullName}
                        onChange={(e) => setNewEntry({ ...newEntry, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter Full Name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <textarea required value={newEntry.reason}
                      onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3} placeholder="Enter reason for flagging" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Flag Type</label>
                      <select value={newEntry.flagType}
                        onChange={(e) => setNewEntry({ ...newEntry, flagType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="SECURITY_CONCERN">Security Concern</option>
                        <option value="OVERSTAY">Overstay</option>
                        <option value="FRAUD">Fraud</option>
                        <option value="DUPLICATE">Duplicate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                      <select value={newEntry.severity}
                        onChange={(e) => setNewEntry({ ...newEntry, severity: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Add to Watchlist
                  </button>
                </form>
              </div>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Active Watchlist ({watchlist.length} entries)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">National ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flag Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {watchlist.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.nationalId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.fullName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{entry.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{entry.flagType}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              entry.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              entry.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              entry.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>{entry.severity}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => handleRemoveWatchlistEntry(entry.id)}
                              className="text-red-600 hover:text-red-900 flex items-center">
                              <Trash2 size={16} className="mr-1" />Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Auto-Assignment Settings</h2>
                <p className="text-gray-600 mt-1">Configure automated application assignment</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Enable Auto-Assignment</h3>
                    <p className="text-sm text-gray-600">Automatically assign new applications to available officers</p>
                  </div>
                  <button onClick={() => setAutoAssignEnabled(!autoAssignEnabled)}
                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
                      autoAssignEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                    <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                      autoAssignEnabled ? 'translate-x-11' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Algorithm</label>
                  <select value={assignmentAlgorithm}
                    onChange={(e) => setAssignmentAlgorithm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!autoAssignEnabled}>
                    <option value="round-robin">Round Robin (Equal Distribution)</option>
                    <option value="load-balanced">Load Balanced (Assign to Least Busy)</option>
                    <option value="skill-based">Skill Based (Match Officer Expertise)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Applications Per Officer</label>
                  <input type="number" min="1" max="50" value={maxApplicationsPerOfficer}
                    onChange={(e) => setMaxApplicationsPerOfficer(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!autoAssignEnabled} />
                  <p className="text-sm text-gray-500 mt-1">Prevent officer overload by setting a maximum threshold</p>
                </div>
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <button onClick={saveAutoAssignSettings}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Save Settings
                  </button>
                  <button onClick={triggerAutoAssignment}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!autoAssignEnabled}>
                    Trigger Auto-Assignment Now
                  </button>
                  <p className="text-sm text-gray-500 text-center">Auto-assignment will automatically process unassigned applications</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
