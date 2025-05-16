import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import Modal from '../../components/common/Modal';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { patient } from '../../services/api';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('scheduled'); // 'scheduled', 'completed', 'cancelled', 'all'

  // Helper function to extract doctor name from various object structures
  const getDoctorName = (doctorObj) => {
    // If it's already a string, just return it
    if (typeof doctorObj === 'string') {
      return doctorObj;
    }
    
    // If it's null or undefined, return a default name
    if (!doctorObj) {
      return 'Doctor';
    }
    
    // If it's an object, try to extract name from various possible structures
    if (typeof doctorObj === 'object') {
      // Check for direct name, username, or firstName/lastName properties
      if (doctorObj.name) {
        return doctorObj.name;
      }
      if (doctorObj.username) {
        return doctorObj.username;
      }
      if (doctorObj.firstName || doctorObj.lastName) {
        return `${doctorObj.firstName || ''} ${doctorObj.lastName || ''}`.trim();
      }
      // Check for nested user object with name property
      if (doctorObj.user && typeof doctorObj.user === 'object') {
        if (doctorObj.user.name) {
          return doctorObj.user.name;
        }
        if (doctorObj.user.username) {
          return doctorObj.user.username;
        }
        if (doctorObj.user.firstName || doctorObj.user.lastName) {
          return `${doctorObj.user.firstName || ''} ${doctorObj.user.lastName || ''}`.trim();
        }
      }
    }
    
    // Default fallback - just return "Doctor" instead of using IDs
    return 'Doctor';
  };
  
  // Helper function to extract specialty from various object structures
  const getSpecialty = (doctorObj, appointmentObj) => {
    // First check if specialty is directly on the appointment
    if (appointmentObj && appointmentObj.specialty) {
      return appointmentObj.specialty;
    }
    
    // If it's a string, we don't have specialty info
    if (typeof doctorObj === 'string') {
      return 'Specialist';
    }
    
    // If it's null or undefined
    if (!doctorObj) {
      return 'Specialist';
    }
    
    // If it's an object, look for specialization/specialty
    if (typeof doctorObj === 'object') {
      if (doctorObj.specialization) {
        return doctorObj.specialization;
      }
      if (doctorObj.specialty) {
        return doctorObj.specialty;
      }
      // Check for nested user object
      if (doctorObj.user && typeof doctorObj.user === 'object') {
        if (doctorObj.user.specialization) {
          return doctorObj.user.specialization;
        }
        if (doctorObj.user.specialty) {
          return doctorObj.user.specialty;
        }
      }
    }
    
    // Default fallback
    return 'Specialist';
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patient.getAppointments();
      
      console.log('Raw appointment data:', response.data);
      
      // Process appointments to ensure times are correctly displayed in local time
      if (Array.isArray(response.data)) {
        response.data = response.data.map(appointment => {
          console.log(`Processing appointment ${appointment.id}, status: ${appointment.status}`);
          
          // Primary source: Use DisplayTime field if available - convert to camelCase
          if (appointment.displayTime) {
            appointment.time = appointment.displayTime;
            console.log(`Appointment ${appointment.id}: using DisplayTime: ${appointment.displayTime}`);
          }
          // Final fallback: Extract time from the date
          else if (!appointment.time && (appointment.date || appointment.appointmentDate)) {
            const dateString = appointment.date || appointment.appointmentDate;
            const appointmentDate = new Date(dateString);
            
            // Make sure we have a valid date
            if (!isNaN(appointmentDate.getTime())) {
              // Extract time from date
              appointment.time = appointmentDate.toLocaleTimeString([], { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              });
              
              console.log(`Appointment ${appointment.id}: fallback time ${appointment.time} from ${dateString}`);
            }
          }
          
          return appointment;
        });
      }
      
      console.log('Processed appointments:', response.data);
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on status
  const bookings = appointments.filter(booking => {
    if (statusFilter === 'all') return true;
    
    const statusStr = String(booking.status).toLowerCase();
    switch (statusFilter) {
      case 'scheduled':
        return statusStr === 'scheduled' || statusStr === '0';
      case 'completed':
        return statusStr === 'completed' || statusStr === '1';
      case 'cancelled':
        return statusStr === 'cancelled' || statusStr === '2';
      default:
        return true;
    }
  });
  
  // Get status class for styling
  const getStatusClass = (status) => {
    switch(status) {
      case 'Upcoming':
        return 'status-upcoming';
      case 'Completed':
        return 'status-completed';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  // Handle filter change
  const handleFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };
  
  // Handle reschedule appointment
  const handleReschedule = (appointmentId) => {
    navigate(`/patient/book-appointments?reschedule=${appointmentId}`);
  };
  
  // Handle cancel appointment
  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        setLoading(true);
        setError(null);
        
        // Call the API to cancel the appointment
        await patient.cancelAppointment(appointmentId);
        
        // Refresh the appointments list
        const response = await patient.getAppointments();
        
        // Process the appointments data
        if (Array.isArray(response.data)) {
          response.data = response.data.map(appointment => {
            if (appointment.displayTime) {
              appointment.time = appointment.displayTime;
            } else if (!appointment.time && (appointment.date || appointment.appointmentDate)) {
              const dateString = appointment.date || appointment.appointmentDate;
              const appointmentDate = new Date(dateString);
              
              if (!isNaN(appointmentDate.getTime())) {
                appointment.time = appointmentDate.toLocaleTimeString([], { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                });
              }
            }
            return appointment;
          });
        }
        
        console.log('Updated appointments after cancellation:', response.data);
        setAppointments(response.data);
      } catch (err) {
        console.error('Error canceling appointment:', err);
        setError('Failed to cancel appointment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Handle view appointment details
  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const getFilteredAppointments = () => {
    if (filter === 'all') {
      return sortAppointmentsByDate(appointments);
    }
    
    const filtered = appointments.filter(appointment => {
      switch (filter) {
        case 'scheduled':
          return isAppointmentScheduled(appointment.status);
        case 'completed':
          return isAppointmentCompleted(appointment.status);
        case 'cancelled':
          return isAppointmentCancelled(appointment.status);
        default:
          return true;
      }
    });
    
    return sortAppointmentsByDate(filtered);
  };

  const getStatusBadgeClass = (status) => {
    // Safely handle undefined or null status
    if (!status && status !== 0) return 'status-scheduled';
    
    // Make sure status is a string
    const statusStr = String(status).toLowerCase();
    
    switch (statusStr) {
      case 'scheduled':
      case '0':
        return 'status-scheduled';
      case 'completed':
      case '1':
        return 'status-completed';
      case 'cancelled':
      case '2':
        return 'status-cancelled';
      default:
        return 'status-scheduled';
    }
  };

  // Function to get display status text
  const getStatusDisplayText = (status) => {
    if (!status && status !== 0) return 'Scheduled';
    
    const statusStr = String(status).toLowerCase();
    
    switch (statusStr) {
      case 'scheduled':
      case '0':
        return 'Scheduled';
      case 'completed':
      case '1':
        return 'Completed';
      case 'cancelled':
      case '2':
        return 'Cancelled';
      default:
        return 'Scheduled';
    }
  };

  // Helper function to check if an appointment is cancelled
  const isAppointmentCancelled = (status) => {
    if (!status && status !== 0) return false;
    const statusStr = String(status).toLowerCase();
    return statusStr === 'cancelled' || statusStr === '2';
  };

  // Helper function to check if an appointment is completed
  const isAppointmentCompleted = (status) => {
    if (!status && status !== 0) return false;
    const statusStr = String(status).toLowerCase();
    return statusStr === 'completed' || statusStr === '1';
  };

  // Helper function to check if an appointment is scheduled
  const isAppointmentScheduled = (status) => {
    if (!status && status !== 0) return true; // Default to scheduled
    const statusStr = String(status).toLowerCase();
    return statusStr === 'scheduled' || statusStr === '0';
  };

  // Function to sort appointments by date
  const sortAppointmentsByDate = (appointments) => {
    return [...appointments].sort((a, b) => {
      // Parse dates for comparison
      let dateA, dateB;

      try {
        // Combine date and time for more accurate sorting
        const dateStrA = a.date + ' ' + (a.displayTime || a.time || '00:00');
        const dateStrB = b.date + ' ' + (b.displayTime || b.time || '00:00');
        
        dateA = new Date(dateStrA);
        dateB = new Date(dateStrB);
        
        // If parsing fails, fall back to just date
        if (isNaN(dateA.getTime())) {
          dateA = new Date(a.date);
        }
        if (isNaN(dateB.getTime())) {
          dateB = new Date(b.date);
        }
      } catch (e) {
        // If there's any error, use simple date comparison
        dateA = new Date(a.date);
        dateB = new Date(b.date);
      }

      // For completed or cancelled appointments, we can push them to the end
      if (isAppointmentCompleted(a.status) && !isAppointmentCompleted(b.status)) {
        return 1;
      }
      if (!isAppointmentCompleted(a.status) && isAppointmentCompleted(b.status)) {
        return -1;
      }
      
      // Sort by date and time
      return dateA - dateB;
    });
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="my-bookings">
          <div className="loading">Loading appointments...</div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="my-bookings">
        <div className="page-header">
          <h1>My Appointments</h1>
          <div className="filter-controls">
            <button
              className={filter === 'scheduled' ? 'active' : ''}
              onClick={() => setFilter('scheduled')}
            >
              Scheduled
            </button>
            <button
              className={filter === 'completed' ? 'active' : ''}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
            <button
              className={filter === 'cancelled' ? 'active' : ''}
              onClick={() => setFilter('cancelled')}
            >
              Cancelled
            </button>
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
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
                  <h3>Appointment with Dr. {getDoctorName(appointment.doctor)}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                    {getStatusDisplayText(appointment.status)}
                  </span>
                </div>
                <div className="appointment-details">
                  <div className="detail-item">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(appointment.date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Time:</span>
                    <span className="value">{appointment.displayTime || formatTime(appointment.time)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Department:</span>
                    <span className="value">{getSpecialty(appointment.doctor, appointment)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Reason:</span>
                    <span className="value">{appointment.reason || 'Consulting'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Notes:</span>
                    <span className="value">{appointment.notes || 'None'}</span>
                  </div>
                  
                </div>
                <div className="appointment-actions">
                  {isAppointmentScheduled(appointment.status) && (
                    <>
                      <button
                        className="reschedule-btn"
                        onClick={() => handleReschedule(appointment.id)}
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

export default MyBookings;