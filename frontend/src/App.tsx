import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/StudentProfile';
import Analytics from './pages/Analytics';
import SkillGap from './pages/SkillGap';
import CourseRecommendations from './pages/CourseRecommendations';
import CareerRoadmap from './pages/CareerRoadmap';
import Chatbot from './pages/Chatbot';
import About from './pages/About';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentProfile />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/skill-gap" element={<SkillGap />} />
          <Route path="/recommendations" element={<CourseRecommendations />} />
          <Route path="/roadmap" element={<CareerRoadmap />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
