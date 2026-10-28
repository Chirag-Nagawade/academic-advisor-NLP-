import { useEffect, useState } from 'react';
import { Users, BookOpen, Award, Clock, Briefcase } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface DashboardResponse {
  total_students: number;
  total_courses: number;
  avg_cgpa?: number;
  average_cgpa?: number;
  avg_attendance?: number;
  average_attendance?: number;
  placement_percentage?: number;
  placement_rate?: number;
  branch_distribution?: Record<string, number>;
  cgpa_distribution?: Record<string, number> | { range: string; count: number }[];
  top_branches_by_cgpa?: { branch: string; avg_cgpa: number }[];
  branch_avg_cgpa?: { branch: string; avg_cgpa: number }[];
}

interface CourseRec {
  title?: string;
  course_name?: string;
  category?: string;
  difficulty?: string;
  match_score?: number;
  similarity_score?: number;
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick recommendations
  const [studentId, setStudentId] = useState('');
  const [recs, setRecs] = useState<CourseRec[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsSearched, setRecsSearched] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    setError('');
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  const fetchRecs = () => {
    if (!studentId.trim()) return;
    setRecsLoading(true);
    setRecsSearched(true);
    api.post('/recommendations', { student_id: studentId.trim() })
      .then(res => {
        const list = res.data.recommendations || res.data || [];
        setRecs(Array.isArray(list) ? list.slice(0, 4) : []);
      })
      .catch(() => setRecs([]))
      .finally(() => setRecsLoading(false));
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboard} />;
  if (!data) return null;

  const avgCgpa = data.avg_cgpa ?? data.average_cgpa ?? 0;
  const avgAtt = data.avg_attendance ?? data.average_attendance ?? 0;
  const placeRate = data.placement_percentage ?? data.placement_rate ?? 0;

  const stats = [
    { label: 'Total Students', value: data.total_students, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Courses', value: data.total_courses, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Average CGPA', value: avgCgpa ? avgCgpa.toFixed(2) : 'N/A', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg Attendance', value: avgAtt ? `${avgAtt.toFixed(1)}%` : 'N/A', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Placement Rate', value: placeRate ? `${placeRate.toFixed(1)}%` : 'N/A', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const pieData = data.branch_distribution
    ? Object.entries(data.branch_distribution).map(([name, value]) => ({ name, value }))
    : [];

  let cgpaChartData: { range: string; count: number }[] = [];
  if (Array.isArray(data.cgpa_distribution)) {
    cgpaChartData = data.cgpa_distribution;
  } else if (data.cgpa_distribution && typeof data.cgpa_distribution === 'object') {
    cgpaChartData = Object.entries(data.cgpa_distribution).map(([range, count]) => ({ range, count }));
  }

  const branchAvgData = data.top_branches_by_cgpa || data.branch_avg_cgpa || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time academic performance & institutional intelligence</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Distribution Pie */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Branch Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={95} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CGPA Distribution Bar */}
        {cgpaChartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">CGPA Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cgpaChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Branch-wise Avg CGPA */}
        {branchAvgData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Branch-wise Average CGPA</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={branchAvgData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="avg_cgpa" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Avg CGPA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-2">Quick Recommendations</h3>
          <p className="text-xs text-gray-500 mb-4">Enter a student ID (e.g. ST00030, ST10975, ST14555) to preview tailored courses.</p>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="e.g. ST00030"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchRecs()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={fetchRecs}
              disabled={recsLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {recsLoading ? 'Loading...' : 'Get Recs'}
            </button>
          </div>
          <div className="flex-1">
            {recs.length > 0 ? (
              <ul className="space-y-2">
                {recs.map((r, i) => (
                  <li key={i} className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-gray-900 text-sm">{r.title || r.course_name}</p>
                      {r.difficulty && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
                          {r.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{r.category}</p>
                  </li>
                ))}
              </ul>
            ) : recsSearched && !recsLoading ? (
              <p className="text-sm text-gray-500 italic py-4">No matching courses found for this student ID.</p>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                Enter a student ID above to explore recommended courses
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
