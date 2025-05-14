import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import { FaUserInjured, FaCalendarCheck } from 'react-icons/fa';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { doctor } from '../../services/api';
import './Dashboard.css';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    appointments: [],
    patients: [],
    recentMedicalRecords: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [appointments, patients] = await Promise.all([
          doctor.getAppointments(),
          doctor.getPatients()
        ]);

        // Get recent medical records for the first few patients
        const recentRecords = await Promise.all(
          patients.data.slice(0, 5).map(patient => 
            doctor.getMedicalRecords(patient.id)
          )
        );

        setDashboardData({
          appointments: appointments.data,
          patients: patients.data,
          recentMedicalRecords: recentRecords.flatMap(record => record.data)
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleViewAppointmentDetails = (appointmentId) => {
    navigate(`/doctor/appointments/${appointmentId}`);
  };

  const handleViewAllAppointments = () => {
    navigate('/doctor/appointments');
  };

  const handleViewPatientDetails = (patientId) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  const handleViewAllPatients = () => {
    navigate('/doctor/patients');
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        // TODO: Replace with actual API call
        // await fetch(`/api/doctor/appointments/${appointmentId}/cancel`, {
        //   method: 'POST',
        // });
        
        // For now, just update the local state
        setDashboardData(prevData => ({
          ...prevData,
          appointments: prevData.appointments.filter(apt => apt.id !== appointmentId)
        }));
      } catch (error) {
        console.error('Error canceling appointment:', error);
        // TODO: Add proper error handling
      }
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </DoctorLayout>
    );
  }

  if (error) {
    return (
      <DoctorLayout>
        <div className="error-container">
          <p>{error}</p>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="doctor-dashboard">
        <div className="welcome-section">
          <h1>Welcome, Dr. {user?.lastName}!</h1>
          <p>Here's an overview of your practice</p>
        </div>

        <div className="dashboard-grid">
          {/* Today's Appointments */}
          <div className="dashboard-card">
            <h3>Today's Appointments</h3>
            {dashboardData.appointments.length > 0 ? (
              <ul className="appointment-list">
                {dashboardData.appointments
                  .filter(appointment => {
                    const appointmentDate = new Date(appointment.date);
                    const today = new Date();
                    return appointmentDate.toDateString() === today.toDateString();
                  })
                  .map(appointment => (
                    <li key={appointment.id} className="appointment-item">
                      <div className="appointment-time">
                        {new Date(appointment.date).toLocaleTimeString()}
                      </div>
                      <div className="appointment-details">
                        <strong>Patient:</strong> {appointment.patientName}
                        <br />
                        <strong>Purpose:</strong> {appointment.purpose}
                        <br />
                        <strong>Status:</strong> {appointment.status}
                      </div>
                      <button
                        className="btn-view"
                        onClick={() => handleViewAppointmentDetails(appointment.id)}
                      >
                        View Details
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <p>No appointments scheduled for today</p>
            )}
            <button
              className="btn-view-all"
              onClick={handleViewAllAppointments}
            >
              View All Appointments
            </button>
          </div>

          {/* Recent Patients */}
          <div className="dashboard-card">
            <h3>Recent Patients</h3>
            {dashboardData.patients.length > 0 ? (
              <ul className="patient-list">
                {dashboardData.patients.slice(0, 5).map(patient => (
                  <li key={patient.id} className="patient-item">
                    <div className="patient-info">
                      <strong>Name:</strong> {patient.firstName} {patient.lastName}
                      <br />
                      <strong>Last Visit:</strong> {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}
                    </div>
                    <button
                      className="btn-view"
                      onClick={() => handleViewPatientDetails(patient.id)}
                    >
                      View Details
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent patients</p>
            )}
            <button
              className="btn-view-all"
              onClick={handleViewAllPatients}
            >
              View All Patients
            </button>
          </div>

          {/* Recent Medical Records */}
          <div className="dashboard-card">
            <h3>Recent Medical Records</h3>
            {dashboardData.recentMedicalRecords.length > 0 ? (
              <ul className="record-list">
                {dashboardData.recentMedicalRecords.slice(0, 5).map(record => (
                  <li key={record.id} className="record-item">
                    <div className="record-info">
                      <strong>Patient:</strong> {record.patientName}
                      <br />
                      <strong>Date:</strong> {new Date(record.createdAt).toLocaleDateString()}
                      <br />
                      <strong>Diagnosis:</strong> {record.diagnosis}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent medical records</p>
            )}
          </div>
        </div>

        <div className="detail-cards">
          {/* Next Appointment Card */}
          <div className="detail-card next-appointment">
            <div className="card-header">
              <h2>Next Appointment</h2>
            </div>
            <div className="card-content">
              {dashboardData.appointments && dashboardData.appointments.length > 0 ? (
                <div className="appointment-details">
                  <div className="appointment-header">
                    <div className="doctor-info">
                      <h3>{typeof dashboardData.appointments[0].patientName === 'string' ? 
                          dashboardData.appointments[0].patientName : 'Patient'}</h3>
                      <p>{dashboardData.appointments[0].purpose || 'Consultation'}</p>
                    </div>
                    <div className="appointment-status">{dashboardData.appointments[0].status || 'Scheduled'}</div>
                  </div>
                  <div className="appointment-time">
                    <div className="date-time">
                      <div className="date-icon">📅</div>
                      <div className="date-details">
                        <p className="label">Date</p>
                        <p className="value">{formatDate(dashboardData.appointments[0].date)}</p>
                      </div>
                    </div>
                    <div className="date-time">
                      <div className="time-icon">⏰</div>
                      <div className="time-details">
                        <p className="label">Time</p>
                        <p className="value">{new Date(dashboardData.appointments[0].date).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button 
                      className="btn-view"
                      onClick={() => handleViewAppointmentDetails(dashboardData.appointments[0].id)}
                    >
                      View Details
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancelAppointment(dashboardData.appointments[0].id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-appointment">
                  <p>No upcoming appointments</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {/* ... existing code ... */}
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
