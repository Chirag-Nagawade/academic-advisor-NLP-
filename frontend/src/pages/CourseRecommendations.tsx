import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, ExternalLink, Sparkles, Filter, Award, CheckCircle, Search } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface RecommendedCourse {
  course_id: string;
  title: string;
  description: string;
  category: string;
  skills: string;
  prerequisites: string;
  difficulty: string;
  recommended_for: string;
  source_url?: string;
  similarity_score?: number;
  final_score?: number;
  match_score?: number;
  recommendation_reason?: string;
}

interface RecResponse {
  student_id?: string;
  query?: {
    interests?: string;
    career_goal?: string;
    skills?: string;
  };
  total_recommendations: number;
  recommendations: RecommendedCourse[];
}

export default function CourseRecommendations() {
  const [searchParams] = useSearchParams();

  // Mode: by student ID or manual query
  const [mode, setMode] = useState<'student' | 'manual'>('student');
  const [studentId, setStudentId] = useState(searchParams.get('student_id') || 'ST00030');

  // Manual inputs
  const [interests, setInterests] = useState('');
  const [careerGoal, setCareerGoal] = useState('Data Scientist');
  const [skills, setSkills] = useState('Python, SQL');

  // Difficulty filter on UI
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const [data, setData] = useState<RecResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecommendations = () => {
    setLoading(true);
    setError('');

    const payload = mode === 'student'
      ? { student_id: studentId.trim() }
      : { interests, career_goal: careerGoal, skills };

    api.post('/recommendations', payload)
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
      setStudentId(urlId);
      setMode('student');
    }
    fetchRecommendations();
  }, [searchParams]);

  const courses = data?.recommendations || [];
  const filteredCourses = selectedDifficulty === 'all'
    ? courses
    : courses.filter(c => c.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase());

  const getDifficultyColor = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'beginner': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'intermediate': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'advanced': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Course Recommendations</h2>
        <p className="text-sm text-gray-500 mt-1">
          TF-IDF Vector Space matching with career goal alignment across the 200-course catalog.
        </p>
      </div>

      {/* Query Selector Tabs & Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex gap-2 border-b border-gray-200 pb-3 mb-4">
          <button
            onClick={() => setMode('student')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              mode === 'student' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Lookup by Student Profile
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              mode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Custom Search Query
          </button>
        </div>

        {mode === 'student' ? (
          <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <input
              type="text"
              placeholder="Enter Student ID (e.g. ST00030, ST10975)..."
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchRecommendations()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={fetchRecommendations}
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Finding...' : 'Get Recommendations'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Career Goal</label>
              <input
                type="text"
                placeholder="e.g. Data Scientist, Cloud Engineer"
                value={careerGoal}
                onChange={e => setCareerGoal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target Skills</label>
              <input
                type="text"
                placeholder="e.g. Python, SQL, Docker"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Interests</label>
              <input
                type="text"
                placeholder="e.g. Artificial Intelligence, Big Data"
                value={interests}
                onChange={e => setInterests(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                onClick={fetchRecommendations}
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Calculating Matches...' : 'Find Matching Courses'}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && <LoadingSpinner message="Evaluating text similarities and ranking catalog courses..." />}
      {error && <ErrorMessage message={error} onRetry={fetchRecommendations} />}

      {!loading && data && (
        <div className="space-y-4">
          {/* Query Summary & Difficulty Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white px-5 py-3.5 rounded-xl border border-gray-200">
            <div>
              <p className="text-xs text-gray-500">
                Found <strong className="text-gray-900">{filteredCourses.length}</strong> recommended courses
                {data.student_id ? ` for student ${data.student_id}` : ''}
              </p>
              {data.query?.career_goal && (
                <p className="text-xs text-indigo-600 font-medium mt-0.5">
                  Targeted Career: {data.query.career_goal}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <label className="text-xs text-gray-600 font-medium">Difficulty:</label>
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Course Cards Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map((c, idx) => {
                const matchScore = c.match_score ?? (c.final_score ? Math.round(c.final_score * 100) : null);

                return (
                  <div
                    key={c.course_id || idx}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:border-indigo-300 transition-all"
                  >
                    <div>
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {c.course_id}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                            {c.category}
                          </span>
                        </div>

                        {c.difficulty && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getDifficultyColor(c.difficulty)}`}>
                            {c.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <h4 className="text-base font-bold text-gray-900 mb-1.5 leading-snug">
                        {c.title}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                        {c.description}
                      </p>

                      {/* Recommendation Explanation */}
                      {c.recommendation_reason && (
                        <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100/70 mb-3 flex items-start gap-2 text-xs text-indigo-900">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span><strong>Why recommended:</strong> {c.recommendation_reason}</span>
                        </div>
                      )}

                      {/* Skills Tags */}
                      {c.skills && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {c.skills.split(';').map((s, sIdx) => (
                            <span key={sIdx} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer / Match & Link */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
                      {matchScore != null && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(10, matchScore))}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{matchScore}% match</span>
                        </div>
                      )}

                      {c.source_url ? (
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                          Course Syllabus <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Curriculum catalog course</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 text-base mb-1">No Courses Found</h3>
              <p className="text-sm text-gray-500">
                Try selecting a different difficulty filter or broadening your search criteria.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
