import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import { formatDate, formatDateTime, formatTime } from '../../utils/dateUtils';
import { patient } from '../../services/api';
import './Appointments.css';

const Appointments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patient.getAppointments();
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        setLoading(true);
        setError(null);
        await patient.cancelAppointment(appointmentId);
        await fetchAppointments(); // Refresh the list
      } catch (err) {
        console.error('Error canceling appointment:', err);
        setError('Failed to cancel appointment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      switch (filter) {
        case 'upcoming':
          return appointmentDate >= now;
        case 'past':
          return appointmentDate < now;
        default:
          return true;
      }
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'status-scheduled';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="appointments">
          <div className="loading">Loading appointments...</div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="appointments">
        <div className="page-header">
          <h1>My Appointments</h1>
          <div className="header-actions">
            <div className="filter-controls">
              <button
                className={filter === 'upcoming' ? 'active' : ''}
                onClick={() => setFilter('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={filter === 'past' ? 'active' : ''}
                onClick={() => setFilter('past')}
              >
                Past
              </button>
              <button
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All
              </button>
            </div>
            <button 
              className="book-new-btn"
              onClick={() => navigate('/patient/book-appointments')}
            >
              Book New Appointment
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="appointments-list">
          {getFilteredAppointments().length === 0 ? (
            <div className="no-appointments">
              <p>No appointments found.</p>
              <button
                className="book-new-btn"
                onClick={() => navigate('/patient/book-appointments')}
              >
                Book New Appointment
              </button>
            </div>
          ) : (
            getFilteredAppointments().map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <h3>Appointment with Dr. {appointment.doctor ? appointment.doctor.user.username : 'Unknown'}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
                <div className="appointment-details">
                  <div className="detail-item">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(appointment.appointmentDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Time:</span>
                    <span className="value">{formatDateTime(appointment.appointmentDate).split(',')[1].trim()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Doctor:</span>
                    <span className="value">{appointment.doctor ? appointment.doctor.user.username : 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Purpose:</span>
                    <span className="value">{appointment.reason}</span>
                  </div>
                  {appointment.notes && (
                    <div className="detail-item">
                      <span className="label">Notes:</span>
                      <span className="value">{appointment.notes}</span>
                    </div>
                  )}
                </div>
                <div className="appointment-actions">
                  {appointment.status.toLowerCase() === 'scheduled' && (
                    <>
                      <button
                        className="reschedule-btn"
                        onClick={() => navigate(`/patient/book-appointments?reschedule=${appointment.id}`)}
                      >
                        Reschedule
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancel(appointment.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PatientLayout>
  );
};

export default Appointments;