import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';
import Start from './pages/Start';
import Signup from './pages/Signup';
import Results from './pages/Results';
import Chat from './pages/Chat';
import Assessments from './pages/Assessments';
import Bank from './pages/Bank';

function HomeRedirect() { const { isAuthenticated, user } = useAuth(); return <Navigate to={isAuthenticated ? (user.role === 'bank' ? '/bank' : '/assessments') : '/login'} replace />; }
export default function App() { return <Routes><Route path="/" element={<HomeRedirect />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route element={<ProtectedRoute role="user" />}><Route path="/assessments" element={<Assessments />} /><Route path="/start" element={<Start />} /><Route path="/results" element={<Results />} /><Route path="/chat" element={<Chat />} /></Route><Route element={<ProtectedRoute role="bank" />}><Route path="/bank" element={<Bank />} /></Route><Route path="*" element={<HomeRedirect />} /></Routes>; }
