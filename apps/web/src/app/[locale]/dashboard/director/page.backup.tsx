'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  summary: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    active: number;
    approvalRate: number;
    avgProcessingTime: number;
  };
  applicationsPerDay: Array<{ date: string; applications: number }>;
  statusBreakdown: {
    SUBMITTED: number;
    UNDER_REVIEW: number;
    APPROVED: number;
    REJECTED: number;
    ACTIVE: number;
    COMPLETED: number;
  };
  officerPerformance: Array<{
    id: string;
    name: string;
    assigned: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function DirectorDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/analytics/director');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;

    const rows = [
      ['KRG e-Visit System - Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Summary Statistics'],
      ['Total Applications', data.summary.total],
      ['Approved', data.summary.approved],
      ['Rejected', data.summary.rejected],
      ['Pending', data.summary.pending],
      ['Active', data.summary.active],
      ['Approval Rate', `${data.summary.approvalRate}%`],
      ['Avg Processing Time', `${data.summary.avgProcessingTime} hours`],
      [''],
      ['Officer Performance'],
      ['Officer', 'Assigned', 'Approved', 'Rejected', 'Pending'],
      ...data.officerPerformance.map((officer) => [
        officer.name,
        officer.assigned,
        officer.approved,
        officer.rejected,
        officer.pending,
      ]),
    ];

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krg-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load analytics data</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const statusData = [
    { name: 'Submitted', value: data.statusBreakdown.SUBMITTED, color: '#F59E0B' },
    { name: 'Under Review', value: data.statusBreakdown.UNDER_REVIEW, color: '#3B82F6' },
    { name: 'Approved', value: data.statusBreakdown.APPROVED, color: '#10B981' },
    { name: 'Rejected', value: data.statusBreakdown.REJECTED, color: '#EF4444' },
    { name: 'Active', value: data.statusBreakdown.ACTIVE, color: '#8B5CF6' },
    { name: 'Completed', value: data.statusBreakdown.COMPLETED, color: '#6B7280' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                📊 Director Analytics Dashboard
              </h1>
              <p className="text-blue-100 mt-2">Real-time system insights and performance metrics</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold flex items-center gap-2"
              >
                📥 Export CSV
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-500">
            <p className="text-sm text-gray-600 font-medium">Total</p>
            <p className="text-3xl font-bold text-gray-900">{data.summary.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <p className="text-sm text-green-600 font-medium">Approved</p>
            <p className="text-3xl font-bold text-green-900">{data.summary.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <p className="text-sm text-red-600 font-medium">Rejected</p>
            <p className="text-3xl font-bold text-red-900">{data.summary.rejected}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-yellow-600 font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-900">{data.summary.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            <p className="text-sm text-purple-600 font-medium">Active</p>
            <p className="text-3xl font-bold text-purple-900">{data.summary.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-sm text-blue-600 font-medium">Approval Rate</p>
            <p className="text-3xl font-bold text-blue-900">{data.summary.approvalRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-indigo-600 font-medium">Avg Time</p>
            <p className="text-3xl font-bold text-indigo-900">{data.summary.avgProcessingTime}h</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Applications Over Time */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Applications Over Time (30 Days)</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded ${
                    chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded ${
                    chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' ? (
                <LineChart data={data.applicationsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applications" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={data.applicationsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="applications" fill="#3B82F6" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Officer Performance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Officer Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Officer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejected</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.officerPerformance.map((officer) => {
                  const processed = officer.approved + officer.rejected;
                  const rate = processed > 0 ? ((officer.approved / processed) * 100).toFixed(0) : '0';
                  return (
                    <tr key={officer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{officer.name}</td>
                      <td className="px-6 py-4 text-gray-700">{officer.assigned}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          {officer.approved}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                          {officer.rejected}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                          {officer.pending}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          parseFloat(rate) >= 70 ? 'bg-green-100 text-green-800' :
                          parseFloat(rate) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(rate) >= 70 ? 'bg-green-500' :
                              parseFloat(rate) >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${rate}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Officer Performance Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Officer Workload Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.officerPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" fill="#10B981" name="Approved" />
              <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
              <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
