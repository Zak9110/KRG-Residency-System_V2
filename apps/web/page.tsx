'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, Users, FileText, AlertTriangle, Settings, RefreshCw,
  UserCheck, Clock, Shield, Plus, Trash2, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
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
