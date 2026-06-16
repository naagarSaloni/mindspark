 import { Navigate, Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'

import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'

import CreateTest from './pages/CreateTest'
import JoinTest from './pages/JoinTest'

import StudentHistory from './pages/StudentHistory'
import TeacherHistory from './pages/TeacherHistory'

import Result from './pages/Result'
import ProtectedRoute from './components/ProtectedRoute'

import AdminPanel from './pages/AdminPanel'

import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";


function App() {
  return (
    <>
      <main>
        <div className="app-shell">

          <Navbar />

          <Routes>

            {/* PUBLIC */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* ROLE REDIRECTS */}
            <Route path="/teacher" element={<Navigate to="/teacher/dashboard" />} />
            <Route path="/student" element={<Navigate to="/student/dashboard" />} />

            {/* TEACHER */}
            <Route
              path="/teacher/dashboard"
              element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>}
            />

            <Route
              path="/teacher/create-test"
              element={<ProtectedRoute role="teacher"><CreateTest /></ProtectedRoute>}
            />

            <Route
              path="/teacher/history"
              element={<ProtectedRoute role="teacher"><TeacherHistory /></ProtectedRoute>}
            />

            {/* STUDENT */}
            <Route
              path="/student/dashboard"
              element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>}
            />

            <Route
              path="/student/join-test"
              element={<ProtectedRoute role="student"><JoinTest /></ProtectedRoute>}
            />

            <Route
              path="/student/history"
              element={<ProtectedRoute role="student"><StudentHistory /></ProtectedRoute>}
            />

            {/* RESULT */}
            <Route
              path="/result"
              element={<ProtectedRoute><Result /></ProtectedRoute>}
            />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" />} />

            <Route path="/admin" element={<AdminPanel />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/verify-otp" element={<VerifyOtp />} />
<Route path="/reset-password" element={<ResetPassword />} />

          </Routes>

        </div>
      </main>

      <Footer />
    </>
  )
}

export default App