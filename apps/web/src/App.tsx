import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import UserActivityPage from './pages/UserActivityPage'
import MediaDetailPage from './pages/MediaDetailPage'
import DiaryPage from './pages/DiaryPage'
import ListsPage from './pages/ListsPage'
import ListDetailPage from './pages/ListDetailPage'
import ProfilePage from './pages/ProfilePage'
import CurtainLoader from './components/CurtainLoader'
import { useAuth } from './stores/auth-context'
import ExplorePage from './pages/ExplorePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null; // We use the global CurtainLoader now
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { user, isLoading } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <CurtainLoader isLoading={isLoading} />
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <LandingPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/activity" element={<UserActivityPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/media/:id" element={<MediaDetailPage />} />
        <Route path="/diary" element={<ProtectedRoute><DiaryPage /></ProtectedRoute>} />
        <Route path="/lists" element={<ProtectedRoute><ListsPage /></ProtectedRoute>} />
        <Route path="/lists/:id" element={<ListDetailPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

