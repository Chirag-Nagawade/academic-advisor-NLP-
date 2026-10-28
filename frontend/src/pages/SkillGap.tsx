import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, AlertCircle, ArrowRight, BookOpen, Map, Sparkles, TrendingUp, Info } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface SkillGapResult {
  student_id: string;
  career_goal: string;
  current_skills: string[];
  interests: string;
  required_skills: string[];
  missing_skills: string[];
  strength_areas: string[];
  improvement_areas: string[];
  recommendations: string[];
  skill_match_percentage: number;
}

export default function SkillGap() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [studentIdInput, setStudentIdInput] = useState(searchParams.get('student_id') || 'ST00030');
  const [data, setData] = useState<SkillGapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runAnalysis = (idToAnalyze: string) => {
    if (!idToAnalyze.trim()) return;
    setLoading(true);
    setError('');

    api.post('/skill-gap', { student_id: idToAnalyze.trim() })
      .then(res => setData(res.data))
      .catch(err => {
        setData(null);
        setError(err.response?.data?.detail || err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const urlId = searchParams.get('student_id');
    if (urlId) {
      setStudentIdInput(urlId);
      runAnalysis(urlId);
    } else {
      runAnalysis('ST00030');
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student Profiling & Skill Gap Analysis</h2>
        <p className="text-sm text-gray-500 mt-1">
          Identifies competency readiness, missing domain skills, and academic strengths for specific career trajectories.
        </p>
      </div>

      {/* Student Selector Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Select Student by ID:
        </label>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="e.g. ST00030, ST10975, ST14555..."
            value={studentIdInput}
            onChange={e => setStudentIdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runAnalysis(studentIdInput)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => runAnalysis(studentIdInput)}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Gap'}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner message="Evaluating career competencies & syllabus gaps..." />}
      {error && <ErrorMessage message={error} onRetry={() => runAnalysis(studentIdInput)} />}

      {!loading && data && (
        <div className="space-y-6">
          {/* Header Summary Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-mono font-semibold rounded">
                  {data.student_id}
                </span>
                <h3 className="text-xl font-bold">Goal: {data.career_goal}</h3>
              </div>
              <p className="text-xs text-indigo-200 mt-2">
                Declared Interests: <span className="text-white font-medium">{data.interests || 'General Engineering'}</span>
              </p>
            </div>

            {/* Match Percentage Ring / Meter */}
            <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-lg border border-white/15">
              <div>
                <p className="text-xs text-indigo-200 font-medium">Curriculum Skill Match</p>
                <p className="text-2xl font-black text-white">{data.skill_match_percentage.toFixed(0)}%</p>
              </div>
              <div className="w-16 bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, data.skill_match_percentage))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Academic Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h4 className="font-semibold text-gray-900">Academic Strengths</h4>
              </div>
              <p className="text-xs text-gray-500 mb-3">Subjects and areas where performance meets or exceeds high marks (≥ 70):</p>
              {data.strength_areas && data.strength_areas.length > 0 ? (
                <ul className="space-y-1.5">
                  {data.strength_areas.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">No specific subject exceeded top threshold.</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h4 className="font-semibold text-gray-900">Recommended Improvement Areas</h4>
              </div>
              <p className="text-xs text-gray-500 mb-3">Courses or subjects that could benefit from dedicated practice:</p>
              {data.improvement_areas && data.improvement_areas.length > 0 ? (
                <ul className="space-y-1.5">
                  {data.improvement_areas.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-800 bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Academic baseline is solid across core subjects.</p>
              )}
            </div>
          </div>

          {/* Skill Matrix: Current vs Required vs Missing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Skills */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="font-semibold text-gray-900">Current Profile Skills</h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">Recorded competencies on student record:</p>
              <div className="flex flex-wrap gap-1.5 flex-1 content-start">
                {data.current_skills && data.current_skills.length > 0 ? (
                  data.current_skills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-medium">
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No prior technical skills listed.</p>
                )}
              </div>
            </div>

            {/* Required Skills for Goal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h4 className="font-semibold text-gray-900">Required For {data.career_goal}</h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">Core industry competencies expected for this role:</p>
              <div className="flex flex-wrap gap-1.5 flex-1 content-start">
                {data.required_skills && data.required_skills.length > 0 ? (
                  data.required_skills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-xs font-medium">
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No benchmark skills mapped.</p>
                )}
              </div>
            </div>

            {/* Missing Skills (Not Listed) */}
            <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="font-semibold text-gray-900">Skills Not Listed in Profile</h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">Gaps to bridge via coursework & projects:</p>
              <div className="flex flex-wrap gap-1.5 flex-1 content-start">
                {data.missing_skills && data.missing_skills.length > 0 ? (
                  data.missing_skills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs font-medium">
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-emerald-600 font-medium">All benchmark skills are documented in student profile!</p>
                )}
              </div>
            </div>
          </div>

          {/* Actionable Next Steps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">Actionable Academic Guidance</h4>
            </div>
            <ul className="space-y-2">
              {data.recommendations && data.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <ArrowRight className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>

            {/* Note alert */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-xs text-blue-800">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Methodology Note:</strong> Unrecorded skills are flagged as "Not listed in profile" rather than assumed missing.
                Target skills and career benchmarks can be updated directly via the Student Profile editor.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-5 pt-3 border-t border-gray-100">
              <button
                onClick={() => navigate(`/recommendations?student_id=${data.student_id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 cursor-pointer transition-colors"
              >
                <BookOpen className="h-4 w-4" /> Recommend Courses For These Gaps
              </button>
              <button
                onClick={() => navigate(`/roadmap?student_id=${data.student_id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 cursor-pointer transition-colors"
              >
                <Map className="h-4 w-4" /> Generate 3-Stage Career Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
