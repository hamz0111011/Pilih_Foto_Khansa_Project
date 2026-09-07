import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ClientGallery from './pages/ClientGallery'
import AlbumViewer from './pages/AlbumViewer'
import ChangePassword from './pages/ChangePassword'
import LandingPage from './pages/LandingPage'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('fg_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — halaman utama publik */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Admin (protected) */}
        <Route path="/dashboard" element={
          <PrivateRoute><AdminDashboard /></PrivateRoute>
        } />
        <Route path="/settings/password" element={
          <PrivateRoute><ChangePassword /></PrivateRoute>
        } />

        {/* Client pages */}
        <Route path="/session/:id" element={<ClientGallery />} />
        <Route path="/session/:id/album" element={<AlbumViewer />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
