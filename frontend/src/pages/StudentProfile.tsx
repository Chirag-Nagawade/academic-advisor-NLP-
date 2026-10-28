import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, ArrowLeft, Target, BookOpen, Map, Award, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface Student {
  Student_ID: string;
  Name?: string;
  Branch?: string;
  CGPA?: number;
  Age?: number;
  Gender?: string;
  State?: string;
  College_Tier?: string;
  Attendance_Percentage?: number;
  Attendance?: number;
  Mathematics_Marks?: number;
  Core_Branch_Subject_Marks?: number;
  Programming_Marks?: number;
  Data_Structures_Algorithms_Marks?: number;
  Communication_Subject_Marks?: number;
  DSA_Problems_Solved?: number;
  Projects_Count?: number;
  Internships_Count?: number;
  Certifications_Count?: number;
  GitHub_Contributions?: number;
  Competitive_Programming_Rating?: number;
  Study_Hours_Per_Week?: number;
  Interests?: string;
  Career_Goal?: string;
  Target_Skills?: string;
  Placement_Status?: string;
  Package_LPA?: number;
  [key: string]: unknown;
}

const BRANCHES = ['', 'CSE', 'AIML', 'ECE', 'EEE', 'ME', 'CE', 'IT'];

export default function StudentProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'find' | 'create'>('find');

  // Find state
  const [searchId, setSearchId] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);

  // Create state
  const [form, setForm] = useState({
    Branch: 'CSE',
    CGPA: '',
    Attendance_Percentage: '',
    Interests: '',
    Career_Goal: 'Software Engineer',
    Target_Skills: '',
    Age: '21',
    Gender: 'Male',
    College_Tier: 'Tier-2',
    Study_Hours_Per_Week: '15'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial load
  useEffect(() => {
    const urlStudentId = searchParams.get('student_id');
    if (urlStudentId) {
      loadSingleStudent(urlStudentId);
    } else {
      doSearch();
    }
  }, [searchParams]);

  const loadSingleStudent = (id: string) => {
    setSearchLoading(true);
    setSearchError('');
    api.get(`/students/${id}`)
      .then(res => setSelected(res.data))
      .catch(err => setSearchError(err.response?.data?.detail || err.message))
      .finally(() => setSearchLoading(false));
  };

  const doSearch = () => {
    setSearchLoading(true);
    setSearchError('');
    const params: Record<string, string | number> = { limit: 25 };
    if (searchId.trim()) params.search = searchId.trim();
    if (branchFilter) params.branch = branchFilter;

    api.get('/students', { params })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : res.data.students || [];
        setResults(list);
      })
      .catch(err => setSearchError(err.response?.data?.detail || err.message))
      .finally(() => setSearchLoading(false));
  };

  const doCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMsg(null);

    const payload = {
      Branch: form.Branch,
      CGPA: form.CGPA ? parseFloat(form.CGPA) : 7.5,
      Attendance_Percentage: form.Attendance_Percentage ? parseFloat(form.Attendance_Percentage) : 80.0,
      Interests: form.Interests,
      Career_Goal: form.Career_Goal,
      Target_Skills: form.Target_Skills,
      Age: parseInt(form.Age) || 21,
      Gender: form.Gender,
      College_Tier: form.College_Tier,
      Study_Hours_Per_Week: parseInt(form.Study_Hours_Per_Week) || 15,
      Placement_Status: 'Not Placed',
      Mathematics_Marks: 75,
      Core_Branch_Subject_Marks: 75,
      Programming_Marks: 75,
      Data_Structures_Algorithms_Marks: 75,
      Communication_Subject_Marks: 75
    };

    api.post('/students', payload)
      .then(res => {
        const newStudent = res.data.student || res.data;
        setCreateMsg({
          type: 'success',
          text: `Profile created successfully with ID: ${newStudent.Student_ID}`
        });
        setSelected(newStudent);
      })
      .catch(err => {
        setCreateMsg({
          type: 'error',
          text: err.response?.data?.detail || err.message
        });
      })
      .finally(() => setCreateLoading(false));
  };

  // Subject marks for chart
  const subjectData = selected ? [
    { subject: 'Math', marks: selected.Mathematics_Marks ?? 0 },
    { subject: 'Core', marks: selected.Core_Branch_Subject_Marks ?? 0 },
    { subject: 'Prog', marks: selected.Programming_Marks ?? 0 },
    { subject: 'DSA', marks: selected.Data_Structures_Algorithms_Marks ?? 0 },
    { subject: 'Comm', marks: selected.Communication_Subject_Marks ?? 0 },
  ] : [];

  const attendanceVal = selected ? (selected.Attendance_Percentage ?? selected.Attendance) : null;

  if (selected) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to student directory
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{selected.Student_ID}</h2>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                {selected.Branch}
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                {selected.Placement_Status || 'Student'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Target Career: <strong className="text-gray-800">{selected.Career_Goal || 'Not specified'}</strong>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/skill-gap?student_id=${selected.Student_ID}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 cursor-pointer transition-colors"
            >
              <Target className="h-3.5 w-3.5" /> Skill Gap
            </button>
            <button
              onClick={() => navigate(`/recommendations?student_id=${selected.Student_ID}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 cursor-pointer transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" /> Courses
            </button>
            <button
              onClick={() => navigate(`/roadmap?student_id=${selected.Student_ID}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 cursor-pointer transition-colors"
            >
              <Map className="h-3.5 w-3.5" /> Roadmap
            </button>
          </div>
        </div>

        {/* Academic Performance & Subject Marks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Academic Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">CGPA</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{selected.CGPA ?? 'N/A'}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-orange-600 font-medium">Attendance</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">
                  {attendanceVal != null ? `${attendanceVal}%` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Study Hours/Week</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{selected.Study_Hours_Per_Week ?? 'N/A'}</p>
              </div>
            </div>

            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subject Performance</h4>
            {subjectData.some(s => s.marks > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="marks" fill="#6366f1" radius={[4, 4, 0, 0]} name="Marks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400">Subject marks not recorded.</p>
            )}
          </div>

          {/* Demographic & College Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 mb-2">Profile & Background</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Age / Gender</p>
                <p className="font-medium text-gray-900">{selected.Age ? `${selected.Age} yrs` : 'N/A'} • {selected.Gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Origin State</p>
                <p className="font-medium text-gray-900">{selected.State || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">College Tier</p>
                <p className="font-medium text-gray-900">{selected.College_Tier || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Placement Package</p>
                <p className="font-medium text-gray-900">
                  {selected.Package_LPA ? `${selected.Package_LPA} LPA` : 'N/A'}
                </p>
              </div>
            </div>

            <hr className="border-gray-100 my-3" />

            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Practical Experience</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{selected.DSA_Problems_Solved ?? 0}</p>
                <p className="text-xs text-gray-500">DSA Solved</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{selected.Projects_Count ?? 0}</p>
                <p className="text-xs text-gray-500">Projects</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{selected.Certifications_Count ?? 0}</p>
                <p className="text-xs text-gray-500">Certifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Career & Skills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Interests & Target Skills</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Academic Interests</p>
              <p className="text-gray-800">{selected.Interests || 'None specified'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Target Skills</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selected.Target_Skills ? (
                  selected.Target_Skills.split(';').map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs">
                      {s.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Directory</h2>
          <p className="text-sm text-gray-500 mt-0.5">Explore existing student records or register new student profiles</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('find')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            tab === 'find'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Find Student
        </button>
        <button
          onClick={() => setTab('create')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            tab === 'create'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Plus className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Register New Student
        </button>
      </div>

      {tab === 'find' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by Student ID (e.g. ST00030)..."
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={branchFilter}
              onChange={e => {
                setBranchFilter(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Branches</option>
              {BRANCHES.filter(Boolean).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <button
              onClick={doSearch}
              disabled={searchLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchError && <ErrorMessage message={searchError} onRetry={doSearch} />}
          {searchLoading && <LoadingSpinner message="Searching students..." />}

          {!searchLoading && results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">CGPA</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Career Goal</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map(s => (
                    <tr key={s.Student_ID} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-indigo-600">{s.Student_ID}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{s.Branch}</span></td>
                      <td className="py-3 px-4 font-medium">{s.CGPA ?? 'N/A'}</td>
                      <td className="py-3 px-4">{s.Attendance_Percentage ?? s.Attendance ?? 'N/A'}%</td>
                      <td className="py-3 px-4 text-gray-600">{s.Career_Goal || 'N/A'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelected(s)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!searchLoading && results.length === 0 && (
            <p className="text-center py-10 text-gray-400 text-sm">No students found matching your criteria.</p>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">Create Student Profile</h3>
          <p className="text-xs text-gray-500 mb-6">Enter new student credentials. This record is safely stored directly into MongoDB.</p>

          {createMsg && (
            <div className={`p-4 rounded-lg text-sm mb-5 flex items-center gap-2 ${
              createMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {createMsg.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />}
              {createMsg.text}
            </div>
          )}

          <form onSubmit={doCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Branch *</label>
                <select
                  value={form.Branch}
                  onChange={e => setForm({ ...form, Branch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {['CSE', 'AIML', 'ECE', 'EEE', 'ME', 'CE', 'IT'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CGPA (0 - 10) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  placeholder="e.g. 8.25"
                  value={form.CGPA}
                  onChange={e => setForm({ ...form, CGPA: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Attendance % *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 85.0"
                  value={form.Attendance_Percentage}
                  onChange={e => setForm({ ...form, Attendance_Percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target Career Goal *</label>
                <select
                  value={form.Career_Goal}
                  onChange={e => setForm({ ...form, Career_Goal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="ML Engineer">ML Engineer</option>
                  <option value="Web Developer">Web Developer</option>
                  <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                  <option value="Cloud Engineer">Cloud Engineer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Embedded Systems Engineer">Embedded Systems Engineer</option>
                  <option value="Mobile App Developer">Mobile App Developer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Interests</label>
              <input
                type="text"
                placeholder="e.g. Machine Learning, Cloud Architecture, Algorithms"
                value={form.Interests}
                onChange={e => setForm({ ...form, Interests: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current / Target Skills (semicolon-separated)</label>
              <input
                type="text"
                placeholder="e.g. Python; SQL; Docker; React"
                value={form.Target_Skills}
                onChange={e => setForm({ ...form, Target_Skills: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {createLoading ? 'Saving to Database...' : 'Save Profile to MongoDB'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
