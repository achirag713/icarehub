import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Landing/Home';
import AboutUs from '../pages/Landing/AboutUs';
import ContactUs from '../pages/Landing/ContactUs';
import SignIn from '../pages/Landing/SignIn';
import SignUp from '../pages/Landing/SignUp';

// Protected routes
import ProtectedRoute from '../components/ProtectedRoute';

// Admin Pages
import AdminDashboard from '../pages/Admin/Dashboard';
import AdminPatients from '../pages/Admin/Patients';
import AdminAppointments from '../pages/Admin/Appointments';
import AdminSettings from '../pages/Admin/Settings';
import AdminDoctors from '../pages/Admin/Doctors';

// Doctor Pages
import DoctorDashboard from '../pages/Doctor/Dashboard';
import DoctorMyPatients from '../pages/Doctor/MyPatients';
import DoctorAppointments from '../pages/Doctor/Appointments';
import DoctorSettings from '../pages/Doctor/Settings';

// Patient Pages
import PatientDashboard from '../pages/Patient/Dashboard';
import PatientFindDoctors from '../pages/Patient/FindDoctors';
import PatientBookAppointments from '../pages/Patient/BookAppointments';
import PatientMyBookings from '../pages/Patient/MyBookings';
import PatientMedicalRecords from '../pages/Patient/MedicalRecords';
import PatientBillings from '../pages/Patient/Billings';
import PatientSettings from '../pages/Patient/Settings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Admin Routes */}
      <Route 
        path="/admin/dashboard" 
        element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />} 
      />
      <Route 
        path="/admin/doctors" 
        element={<ProtectedRoute element={<AdminDoctors />} allowedRoles={['admin']} />} 
      />
      <Route 
        path="/admin/patients" 
        element={<ProtectedRoute element={<AdminPatients />} allowedRoles={['admin']} />} 
      />
      <Route 
        path="/admin/appointments" 
        element={<ProtectedRoute element={<AdminAppointments />} allowedRoles={['admin']} />} 
      />
      <Route 
        path="/admin/settings" 
        element={<ProtectedRoute element={<AdminSettings />} allowedRoles={['admin']} />} 
      />

      {/* Doctor Routes */}
      <Route 
        path="/doctor/dashboard" 
        element={<ProtectedRoute element={<DoctorDashboard />} allowedRoles={['doctor']} />} 
      />
      <Route 
        path="/doctor/my-patients" 
        element={<ProtectedRoute element={<DoctorMyPatients />} allowedRoles={['doctor']} />} 
      />
      <Route 
        path="/doctor/appointments" 
        element={<ProtectedRoute element={<DoctorAppointments />} allowedRoles={['doctor']} />} 
      />
      <Route 
        path="/doctor/settings" 
        element={<ProtectedRoute element={<DoctorSettings />} allowedRoles={['doctor']} />} 
      />

      {/* Patient Routes */}
      <Route 
        path="/patient/dashboard" 
        element={<ProtectedRoute element={<PatientDashboard />} allowedRoles={['patient']} />} 
      />
      <Route 
        path="/patient/find-doctors" 
        element={<ProtectedRoute element={<PatientFindDoctors />} allowedRoles={['patient']} />} 
      />
      <Route 
        path="/patient/book-appointments" 
        element={<ProtectedRoute element={<PatientBookAppointments />} allowedRoles={['patient']} />} 
      />
      <Route 
        path="/patient/my-bookings" 
        element={<ProtectedRoute element={<PatientMyBookings />} allowedRoles={['patient']} />} 
      />
      <Route 
        path="/patient/medical-records" 
        element={<ProtectedRoute element={<PatientMedicalRecords />} allowedRoles={['patient']} />} 
      />
      <Route 
        path="/patient/billings" 
        element={<ProtectedRoute element={<PatientBillings />} allowedRoles={['patient']} />} 
      />
      <Route 
        path="/patient/settings" 
        element={<ProtectedRoute element={<PatientSettings />} allowedRoles={['patient']} />} 
      />

      {/* Redirect for dashboard routes */}
      <Route 
        path="/dashboard" 
        element={<Navigate to="/patient/dashboard" replace />} 
      />

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
