import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { admin } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
      totalRevenue: 0
    },
    recentAppointments: [],
    recentPatients: [],
    recentDoctors: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [stats, appointments, patients, doctors] = await Promise.all([
          admin.getDashboardStats(),
          admin.getRecentAppointments(),
          admin.getRecentPatients(),
          admin.getRecentDoctors()
        ]);

        console.log('Recent Patients Data:', patients.data); // Debug log

        setDashboardData({
          stats: stats.data,
          recentAppointments: appointments.data,
          recentPatients: patients.data,
          recentDoctors: doctors.data
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

  // Helper function to calculate age from date of birth
  

  if (loading) {
    return (
      <AdminLayout>
        <div className="dashboard-container">
          <div className="loading">Loading dashboard data...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="dashboard-container">
          <div className="error">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="welcome-section">
          <h1>Welcome, {user?.username || 'Admin'}!</h1>
          <p>Here's an overview of the hospital management system</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Patients</h3>
            <div className="stat-value">{dashboardData.stats.totalPatients}</div>
          </div>
          <div className="stat-card">
            <h3>Total Doctors</h3>
            <div className="stat-value">{dashboardData.stats.totalDoctors}</div>
          </div>
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <div className="stat-value">{dashboardData.stats.totalAppointments}</div>
          </div>
          <div className="stat-card">
            <h3>Total Bills</h3>
            <div className="stat-value">{Math.round(dashboardData.stats.totalPatients * 1.2)}</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Recent Appointments</h3>
            {dashboardData.recentAppointments.length > 0 ? (
              <ul className="appointment-list">
                {dashboardData.recentAppointments.map(appointment => (
                  <li key={appointment.id} className="appointment-item">
                    <div className="appointment-date">
                      {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div className="appointment-details">
                      <strong>Patient:</strong> {appointment.patientName}
                      <br />
                      <strong>Doctor:</strong> Dr. {appointment.doctorName}
                      <br />
                      <strong>Status:</strong> {appointment.status}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent appointments</p>
            )}
          </div>

          <div className="dashboard-card">
            <h3>Recent Patients</h3>
            {dashboardData.recentPatients.length > 0 ? (
              <ul className="patient-list">
                {dashboardData.recentPatients.map(patient => (
                  <li key={patient.id} className="patient-item">
                    <div className="patient-name">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="patient-details">
                      
                      <strong>Gender:</strong> {patient.gender}
                      <br />
                      <strong>Last Visit:</strong> {new Date(patient.lastVisit).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent patients</p>
            )}
          </div>

          <div className="dashboard-card">
            <h3>Recent Doctors</h3>
            {dashboardData.recentDoctors.length > 0 ? (
              <ul className="doctor-list">
                {dashboardData.recentDoctors.map(doctor => (
                  <li key={doctor.id} className="doctor-item">
                    <div className="doctor-name">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </div>
                    <div className="doctor-details">
                      <strong>Specialization:</strong> {doctor.specialization}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent doctors</p>
            )}
          </div>

          
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
