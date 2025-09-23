import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Viewer from './Viewer.jsx'
import Login from './Admin/Login.jsx'
import ForgotPassword from './Admin/ForgotPassword.jsx'
import ResetPassword from './Admin/ResetPassword.jsx'

import Announcement from './Viewer/Announcement/Announcement.jsx'
import Calendar from './Viewer/Calendar/Calendar.jsx'

import PreRegistration from './Viewer/PreRegistration/Pre-registration.jsx'
import Appointment from './Viewer/PreRegistration/Appointment.jsx'
import ConfirmRegistration from './Viewer/PreRegistration/ConfirmRegistration.jsx'
import Success from './Viewer/PreRegistration/Success.jsx'

import SchoolInfo from './Viewer/SchoolInfo/SchoolInfo.jsx'

import Homepage from './Admin/Homepage.jsx'

import ManageAnnouncement from './Admin/ManageAnnouncement/ManageAnnouncement.jsx'

import ManageCalendar from './Admin/ManageCalendar/ManageCalendar.jsx'
import ManagePreRegistration from './Admin/ManagePreRegistration/ManagePreRegistration.jsx'
import UpdateAppointment from './Admin/ManagePreRegistration/UpdateAppointment.jsx'
import ManageAccount from './Admin/ManageAccount/ManageAccount.jsx'

import ViewReport from './Admin/ViewReport/ViewReport.jsx'

import ProtectedRoute from './_components/ProtectedRoute.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Viewers */}
        <Route path="/" element={<Viewer />} />
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="announcement" element={<Announcement />} />
        <Route path="calendar" element={<Calendar />} />

        <Route path="preregistration" element={<PreRegistration />} />
        <Route path="appointment" element={<Appointment />} />
        <Route path="confirmRegistration" element={<ConfirmRegistration />} />
        <Route path="success" element={<Success />} />

        <Route path="schoolinfo" element={<SchoolInfo />} />

        {/* Admins (Protected) */}
        <Route path="/admin-homepage" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
        <Route path="/manage-announcement" element={<ProtectedRoute><ManageAnnouncement /></ProtectedRoute>} />
        <Route path="/manage-calendar" element={<ProtectedRoute><ManageCalendar /></ProtectedRoute>} />
        <Route path="/manage-preregistration" element={<ProtectedRoute><ManagePreRegistration /></ProtectedRoute>} />
        <Route path="/update-appointment" element={<ProtectedRoute><UpdateAppointment /></ProtectedRoute>} />
        <Route path="/manage-account" element={<ProtectedRoute><ManageAccount /></ProtectedRoute>} />
        <Route path="/view-report" element={<ProtectedRoute><ViewReport /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
