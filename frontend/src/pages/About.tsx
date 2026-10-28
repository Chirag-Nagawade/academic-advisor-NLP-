import { useState, useEffect } from 'react';
import {
  Info, Cpu, Database, Layout, BookOpen, Sparkles, CheckCircle2,
  Code2, GitCompare, FileSearch, ShieldAlert, Layers
} from 'lucide-react';
import api from '../api/client';

export default function About() {
  // Preprocessing Demo State
  const [prepInput, setPrepInput] = useState('Machine Learning & Data Structures in 2026!');
  const [prepResult, setPrepResult] = useState<any>(null);
  const [prepLoading, setPrepLoading] = useState(false);

  // Similarity Demo State
  const [simText1, setSimText1] = useState('Deep Learning and Neural Networks for Computer Vision');
  const [simText2, setSimText2] = useState('Machine Learning and Artificial Intelligence algorithms');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // TF-IDF Demo State
  const [tfidfTerms, setTfidfTerms] = useState<any[]>([]);
  const [tfidfLoading, setTfidfLoading] = useState(false);

  useEffect(() => {
    runPreprocessing();
    runSimilarity();
    runTfidf();
  }, []);

  const runPreprocessing = () => {
    if (!prepInput.trim()) return;
    setPrepLoading(true);
    api.post('/nlp/preprocess', { text: prepInput })
      .then(res => setPrepResult(res.data))
      .catch(() => {})
      .finally(() => setPrepLoading(false));
  };

  const runSimilarity = () => {
    if (!simText1.trim() || !simText2.trim()) return;
    setSimLoading(true);
    api.post('/nlp/similarity', { text1: simText1, text2: simText2 })
      .then(res => setSimResult(res.data))
      .catch(() => {})
      .finally(() => setSimLoading(false));
  };

  const runTfidf = () => {
    setTfidfLoading(true);
    api.get('/nlp/tfidf')
      .then(res => setTfidfTerms(res.data.top_terms || []))
      .catch(() => {})
      .finally(() => setTfidfLoading(false));
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">About Intelligent Academic Advisor</h2>
        <p className="text-sm text-gray-500 mt-1">
          A college-level B.Tech CSE (AIML) capstone project engineered for automated academic auditing, skill gap diagnosis, and curriculum intelligence.
        </p>
      </div>

      {/* Tech Stack Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-indigo-600">
            <Layout className="h-5 w-5" />
            <h4 className="font-bold text-gray-900">Frontend</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">Modern single-page client architecture:</p>
          <ul className="text-xs space-y-1 text-gray-700">
            <li>• React 19 + TypeScript</li>
            <li>• Vite build engine</li>
            <li>• Tailwind CSS</li>
            <li>• Recharts & Lucide React</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <Cpu className="h-5 w-5" />
            <h4 className="font-bold text-gray-900">Backend API</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">Asynchronous Python microservice:</p>
          <ul className="text-xs space-y-1 text-gray-700">
            <li>• FastAPI</li>
            <li>• Scikit-learn (TF-IDF, Cosine)</li>
            <li>• Pandas & NumPy</li>
            <li>• PyMuPDF (PDF Parser)</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-purple-600">
            <Database className="h-5 w-5" />
            <h4 className="font-bold text-gray-900">Primary Database</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">Document-oriented NoSQL storage:</p>
          <ul className="text-xs space-y-1 text-gray-700">
            <li>• MongoDB / Atlas</li>
            <li>• PyMongo official driver</li>
            <li>• Collections: <code>students</code>, <code>courses</code></li>
            <li>• Idempotent bulk upsert scripts</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-orange-600">
            <Sparkles className="h-5 w-5" />
            <h4 className="font-bold text-gray-900">RAG & NLP</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">Hybrid retrieval & LLM pipeline:</p>
          <ul className="text-xs space-y-1 text-gray-700">
            <li>• In-memory vector chunk index</li>
            <li>• Term Frequency-Inverse Doc Freq</li>
            <li>• Optional Google Gemini 2.0 API</li>
            <li>• Exact document citations</li>
          </ul>
        </div>
      </div>

      {/* Interactive NLP Demonstration Suite */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Code2 className="h-5 w-5" />
            <h3 className="text-lg font-bold text-gray-900">Interactive NLP Feature Demonstration</h3>
          </div>
          <p className="text-xs text-gray-500">
            Test and inspect the core Natural Language Processing algorithms powering recommendation matching and document retrieval.
          </p>
        </div>

        {/* Feature 1: Text Preprocessing Pipeline */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-indigo-600" />
              1. Text Preprocessing Pipeline
            </h4>
            <span className="text-[11px] font-mono text-gray-500">POST /api/nlp/preprocess</span>
          </div>
          <p className="text-xs text-gray-600">
            Converts raw input to lowercase, strips punctuation marks, tokenizes characters into terms, and removes non-informative stop words.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={prepInput}
              onChange={e => setPrepInput(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={runPreprocessing}
              disabled={prepLoading}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {prepLoading ? '...' : 'Process'}
            </button>
          </div>

          {prepResult && (
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1 font-mono">
              <p><span className="text-gray-400">Tokens:</span> <span className="text-indigo-600 font-semibold">{JSON.stringify(prepResult.tokens)}</span></p>
              <p><span className="text-gray-400">Cleaned String:</span> <span className="text-gray-800">"{prepResult.cleaned_text}"</span></p>
            </div>
          )}
        </div>

        {/* Feature 2: Cosine Similarity Matching */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-emerald-600" />
              2. TF-IDF Cosine Similarity Calculation
            </h4>
            <span className="text-[11px] font-mono text-gray-500">POST /api/nlp/similarity</span>
          </div>
          <p className="text-xs text-gray-600">
            Measures cosine angle between two normalized high-dimensional term vectors. Output spans from 0.0 (orthogonal/unrelated) to 1.0 (identical terms).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Text 1"
              value={simText1}
              onChange={e => setSimText1(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
            />
            <input
              type="text"
              placeholder="Text 2"
              value={simText2}
              onChange={e => setSimText2(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
            />
          </div>
          <button
            onClick={runSimilarity}
            disabled={simLoading}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            {simLoading ? 'Calculating...' : 'Compute Similarity Score'}
          </button>

          {simResult && (
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-gray-500">Cosine Score: </span>
                <strong className="text-emerald-700 text-sm font-mono">{simResult.similarity_score}</strong>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium border border-emerald-200">
                {simResult.interpretation}
              </span>
            </div>
          )}
        </div>

        {/* Feature 3: Corpus TF-IDF Term Extraction */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-600" />
              3. Course Catalog Corpus Keywords (TF-IDF)
            </h4>
            <span className="text-[11px] font-mono text-gray-500">GET /api/nlp/tfidf</span>
          </div>
          <p className="text-xs text-gray-600">
            Top salient terms with highest Inverse Document Frequency weighting extracted dynamically across all 200 catalog courses:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
            {tfidfTerms.map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs text-gray-700 font-mono shadow-2xs"
              >
                {t.term} <span className="text-purple-600 text-[10px]">({t.score})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset & Academic Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
          <ShieldAlert className="h-4 w-4 text-amber-700" />
          <span>Academic Dataset Integrity Notice</span>
        </div>
        <p className="leading-relaxed">
          <strong>Student Records Dataset:</strong> The 1,200 student records contained in <code>data/student_profiles.csv</code> represent
          curated synthetic demonstration profiles generated for educational prototype evaluation. Field values such as individual subject marks,
          declared interests, and package LPA should not be construed as verified external student reports.
        </p>
        <p className="leading-relaxed">
          <strong>Course Catalog:</strong> The 200 catalog records in <code>data/courses.csv</code> serve as a seed curriculum dataset
          curated for engineering degree specializations. Course links point to standard NPTEL/curriculum repositories.
        </p>
      </div>
    </div>
  );
}
