import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Map, Calendar, BookOpen, Layers, CheckCircle2, Lightbulb, ExternalLink, ArrowRight, Target } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface RoadmapCourse {
  course_id: string;
  title: string;
  category?: string;
  difficulty?: string;
  skills?: string;
  source_url?: string;
}

interface RoadmapStage {
  stage: number;
  title: string;
  subtitle?: string;
  timeframe?: string;
  skills: string[];
  courses: RoadmapCourse[];
  learning_suggestions?: string[];
  project_ideas?: string[];
}

interface RoadmapResponse {
  student_id: string;
  career_goal: string;
  generated_at?: string;
  stages: RoadmapStage[];
}

export default function CareerRoadmap() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState(searchParams.get('student_id') || 'ST00030');
  const [data, setData] = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRoadmap = (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');

    api.post('/roadmap', { student_id: id.trim() })
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
      fetchRoadmap(urlId);
    } else {
      fetchRoadmap('ST00030');
    }
  }, [searchParams]);

  const getStageTheme = (stageNum: number) => {
    switch (stageNum) {
      case 1:
        return {
          border: 'border-l-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800',
          iconBg: 'bg-emerald-500 text-white',
          cardBg: 'bg-emerald-50/30'
        };
      case 2:
        return {
          border: 'border-l-indigo-500',
          badge: 'bg-indigo-100 text-indigo-800',
          iconBg: 'bg-indigo-600 text-white',
          cardBg: 'bg-indigo-50/30'
        };
      case 3:
      default:
        return {
          border: 'border-l-purple-500',
          badge: 'bg-purple-100 text-purple-800',
          iconBg: 'bg-purple-600 text-white',
          cardBg: 'bg-purple-50/30'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Career Roadmap</h2>
        <p className="text-sm text-gray-500 mt-1">
          3-Stage structured progression pathway personalized from student skill gaps and the course catalog.
        </p>
      </div>

      {/* Student Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Generate Career Roadmap for Student:
        </label>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="e.g. ST00030, ST10975, ST14555..."
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchRoadmap(studentId)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => fetchRoadmap(studentId)}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {loading ? 'Synthesizing...' : 'Generate Roadmap'}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner message="Mapping skills to sequential progression stages & curated courses..." />}
      {error && <ErrorMessage message={error} onRetry={() => fetchRoadmap(studentId)} />}

      {!loading && data && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-mono text-xs font-semibold rounded">
                  {data.student_id}
                </span>
                <h3 className="text-xl font-bold text-gray-900">
                  Target: {data.career_goal}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Progression path calibrated across 3 consecutive developmental milestones.
              </p>
            </div>

            <button
              onClick={() => navigate(`/skill-gap?student_id=${data.student_id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <Target className="h-3.5 w-3.5" /> View Gap Diagnostics
            </button>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-6">
            {data.stages && data.stages.map((stage) => {
              const theme = getStageTheme(stage.stage);

              return (
                <div
                  key={stage.stage}
                  className={`bg-white rounded-xl border-l-4 ${theme.border} border border-gray-200 p-6 shadow-sm`}
                >
                  {/* Stage Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full ${theme.iconBg} flex items-center justify-center font-bold text-sm shrink-0`}>
                        {stage.stage}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{stage.title}</h4>
                        {stage.subtitle && (
                          <p className="text-xs text-gray-500">{stage.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {stage.timeframe && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{stage.timeframe}</span>
                      </div>
                    )}
                  </div>

                  {/* Competencies to Master */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Competencies to Master in this Stage:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.skills && stage.skills.map((skill, sIdx) => (
                        <span key={sIdx} className={`px-2.5 py-1 rounded text-xs font-medium ${theme.badge}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Courses from Catalog */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                      Recommended Catalog Courses:
                    </p>

                    {stage.courses && stage.courses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stage.courses.map((course, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className="text-xs font-mono text-gray-500">{course.course_id}</span>
                                {course.difficulty && (
                                  <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-700 font-medium">
                                    {course.difficulty}
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-gray-900 text-sm">{course.title}</p>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-between items-center">
                              <span className="text-xs text-gray-500">{course.category || 'Core'}</span>
                              {course.source_url && (
                                <a
                                  href={course.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                                >
                                  Course Page <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Explore foundational electives in the courses tab.</p>
                    )}
                  </div>

                  {/* Project Ideas or Learning Suggestions */}
                  {((stage.project_ideas && stage.project_ideas.length > 0) ||
                    (stage.learning_suggestions && stage.learning_suggestions.length > 0)) && (
                    <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-100 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1.5">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                        <span>Practical Milestones & Project Suggestions:</span>
                      </div>
                      <ul className="space-y-1 text-amber-800 list-disc list-inside">
                        {(stage.project_ideas || stage.learning_suggestions || []).map((idea, iIdx) => (
                          <li key={iIdx}>{idea}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
