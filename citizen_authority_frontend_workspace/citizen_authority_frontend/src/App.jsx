import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SignupCitizenPage from './pages/SignupCitizenPage';
import LoginCitizenPage from './pages/LoginCitizenPage';
import SignupAuthorityPage from './pages/SignupAuthorityPage';
import LoginAuthorityPage from './pages/LoginAuthorityPage';
import IssueFormPage from './pages/IssueFormPage';
import AuthorityDashboardPage from './pages/AuthorityDashboardPage';
import DeletedIssuesPage from './pages/DeletedIssuesPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import IssueDetailPage from './pages/IssueDetailPage';
import { Fragment } from 'react';

// Import global styles so that CSS variables and classes are available everywhere
import './App.css';
import './index.css';

function AppContent() {
  const location = useLocation();

  const hideNavbarOnPaths = ['/', '/login/citizen', '/signup/citizen', '/login/authority', '/signup/authority'];
  const hideNavbar = hideNavbarOnPaths.includes(location.pathname);

  return (
    <Fragment>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup/citizen" element={<SignupCitizenPage />} />
        <Route path="/login/citizen" element={<LoginCitizenPage />} />
        <Route path="/signup/authority" element={<SignupAuthorityPage />} />
        <Route path="/login/authority" element={<LoginAuthorityPage />} />
        <Route path="/issue-form" element={<ProtectedRoute role="citizen"><IssueFormPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute role="authority"><AuthorityDashboardPage /></ProtectedRoute>} />
        <Route path="/deleted-issues" element={<ProtectedRoute role="authority"><DeletedIssuesPage /></ProtectedRoute>} />
        <Route path="/issue/:id" element={<ProtectedRoute role="authority"><IssueDetailPage /></ProtectedRoute>} />
        {/* Catch-all for client-side 404: renders HomePage or a NotFound component */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Fragment>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
