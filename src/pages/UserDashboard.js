import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import UserStudy from '../components/UserStudy';
import UserQuiz from '../components/UserQuiz';
import UserCertificates from '../components/UserCertificates';
import UserOverview from '../components/UserOverview';
import '../pages/Dashboard.css';

const SECTIONS = [
  { id: 'overview', icon: '◈', label: 'My Dashboard' },
  { id: 'study', icon: '▤', label: 'Study Materials' },
  { id: 'quiz', icon: '◎', label: 'Take a Quiz' },
  { id: 'certificates', icon: '✦', label: 'My Certificates' },
];

export default function UserDashboard({ user, onLogout, toast }) {
  const [section, setSection] = useState('overview');
  const [quizMaterial, setQuizMaterial] = useState(null);

  const startQuiz = (material) => {
    setQuizMaterial(material);
    setSection('quiz');
  };

  return (
    <div className="dashboard-root">
      <Sidebar user={user} activeSection={section} sections={SECTIONS} onNavigate={s => { setSection(s); if (s !== 'quiz') setQuizMaterial(null); }} onLogout={onLogout} />
      <main className="dashboard-main">
        {section === 'overview' && <UserOverview user={user} onNavigate={setSection} onStartQuiz={startQuiz} />}
        {section === 'study' && <UserStudy user={user} onStartQuiz={startQuiz} toast={toast} />}
        {section === 'quiz' && <UserQuiz user={user} toast={toast} preselectedMaterial={quizMaterial} onNavigate={setSection} />}
        {section === 'certificates' && <UserCertificates user={user} />}
      </main>
    </div>
  );
}
