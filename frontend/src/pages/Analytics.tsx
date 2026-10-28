import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface RawAnalyticsResponse {
  cgpa_distribution?: Record<string, number> | { range: string; count: number }[];
  avg_cgpa_by_branch?: { branch: string; avg_cgpa: number; count?: number }[];
  branch_avg_cgpa?: { branch: string; avg_cgpa: number }[];
  attendance_distribution?: Record<string, number> | { range: string; count: number }[];
  attendance_vs_cgpa?: { CGPA?: number; Attendance_Percentage?: number; attendance?: number; cgpa?: number }[];
  subject_averages?: Record<string, number> | { subject: string; average: number }[];
  placement_by_branch?: { branch: string; total: number; placed: number; percentage?: number }[];
  study_hours_vs_cgpa?: { CGPA?: number; Study_Hours_Per_Week?: number; study_hours?: number; cgpa?: number }[];
}

const BRANCHES = ['', 'CSE', 'AIML', 'ECE', 'EEE', 'ME', 'CE', 'IT'];

export default function Analytics() {
  const [data, setData] = useState<RawAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState('');

  const fetchData = (branchVal?: string) => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    if (branchVal) params.branch = branchVal;
    api.get('/analytics', { params })
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleBranchChange = (val: string) => {
    setBranch(val);
    fetchData(val);
  };

  if (loading) return <LoadingSpinner message="Calculating academic analytics..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => fetchData(branch)} />;
  if (!data) return null;

  // Normalize CGPA distribution
  let cgpaChart: { range: string; count: number }[] = [];
  if (Array.isArray(data.cgpa_distribution)) {
    cgpaChart = data.cgpa_distribution;
  } else if (data.cgpa_distribution && typeof data.cgpa_distribution === 'object') {
    cgpaChart = Object.entries(data.cgpa_distribution).map(([range, count]) => ({ range, count }));
  }

  // Normalize Branch Avg CGPA
  const branchAvg = data.avg_cgpa_by_branch || data.branch_avg_cgpa || [];

  // Normalize Attendance distribution
  let attChart: { range: string; count: number }[] = [];
  if (Array.isArray(data.attendance_distribution)) {
    attChart = data.attendance_distribution;
  } else if (data.attendance_distribution && typeof data.attendance_distribution === 'object') {
    attChart = Object.entries(data.attendance_distribution).map(([range, count]) => ({ range, count }));
  }

  // Normalize Attendance vs CGPA scatter
  const attVsCgpa = (data.attendance_vs_cgpa || []).map(item => ({
    attendance: item.Attendance_Percentage ?? item.attendance ?? 0,
    cgpa: item.CGPA ?? item.cgpa ?? 0,
  })).filter(p => p.attendance > 0 && p.cgpa > 0);

  // Normalize Subject Averages
  let subjectsChart: { subject: string; average: number }[] = [];
  if (Array.isArray(data.subject_averages)) {
    subjectsChart = data.subject_averages;
  } else if (data.subject_averages && typeof data.subject_averages === 'object') {
    subjectsChart = Object.entries(data.subject_averages).map(([subject, average]) => ({
      subject,
      average: Number(average)
    }));
  }

  // Normalize Placement by branch
  const placementChart = (data.placement_by_branch || []).map(p => ({
    branch: p.branch,
    placed: p.placed,
    not_placed: Math.max(0, p.total - p.placed),
    total: p.total,
    percentage: p.percentage ?? Math.round((p.placed / Math.max(1, p.total)) * 100),
  }));

  // Normalize Study Hours vs CGPA
  const studyVsCgpa = (data.study_hours_vs_cgpa || []).map(item => ({
    study_hours: item.Study_Hours_Per_Week ?? item.study_hours ?? 0,
    cgpa: item.CGPA ?? item.cgpa ?? 0,
  })).filter(p => p.study_hours > 0 && p.cgpa > 0);

  const Card = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Empirical data analysis computed dynamically across student batches</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Filter Branch:</label>
          <select
            value={branch}
            onChange={e => handleBranchChange(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="">All Branches</option>
            {BRANCHES.filter(Boolean).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CGPA Distribution */}
        {cgpaChart.length > 0 && (
          <Card title="CGPA Distribution" subtitle="Distribution of cumulative grade point averages">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cgpaChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Avg CGPA by Branch */}
        {branchAvg.length > 0 && (
          <Card title="Average CGPA by Branch" subtitle="Performance comparison across academic departments">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={branchAvg} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="branch" tick={{ fontSize: 11 }} width={55} />
                <Tooltip />
                <Bar dataKey="avg_cgpa" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Avg CGPA" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Attendance Distribution */}
        {attChart.length > 0 && (
          <Card title="Attendance Distribution" subtitle="Percentage brackets across student population">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={attChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} unit="%" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Attendance vs CGPA scatter */}
        {attVsCgpa.length > 0 && (
          <Card title="Attendance vs CGPA" subtitle="Correlation study (Note: correlation does not imply causation)">
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="attendance" name="Attendance" unit="%" tick={{ fontSize: 11 }} domain={[50, 100]} />
                <YAxis dataKey="cgpa" name="CGPA" domain={[4, 10]} tick={{ fontSize: 11 }} />
                <ZAxis range={[25, 25]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={attVsCgpa} fill="#8b5cf6" name="Students" />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Subject-wise Averages */}
        {subjectsChart.length > 0 && (
          <Card title="Subject-wise Average Marks" subtitle="Mean performance per course area (out of 100)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjectsChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 10 }} interval={0} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="average" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Average Score" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Placement by Branch */}
        {placementChart.length > 0 && (
          <Card title="Placement Outcomes by Branch" subtitle="Proportion of students placed vs looking for opportunities">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={placementChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="placed" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} name="Placed" />
                <Bar dataKey="not_placed" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} name="Not Placed" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Study Hours vs CGPA */}
        {studyVsCgpa.length > 0 && (
          <Card title="Study Hours/Week vs CGPA" subtitle="Examining relationship between weekly study time and GPA">
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="study_hours" name="Study Hours" unit=" hrs" tick={{ fontSize: 11 }} />
                <YAxis dataKey="cgpa" name="CGPA" domain={[4, 10]} tick={{ fontSize: 11 }} />
                <ZAxis range={[25, 25]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={studyVsCgpa} fill="#06b6d4" name="Student Sample" />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}
