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
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'

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
      
      // Process appointments to ensure times are correctly displayed in local time
      if (Array.isArray(response.data)) {
        response.data = response.data.map(appointment => {
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
      
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on status
  const bookings = statusFilter === 'all' 
    ? appointments 
    : appointments.filter(booking => booking.status.toLowerCase() === statusFilter);
  
  // Generate dates for the next 7 days (for rescheduling)
  useEffect(() => {
    if (showRescheduleModal) {
      const dates = [];
      const today = new Date();
      
      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      setAvailableDates(dates);
    }
  }, [showRescheduleModal]);

  // Generate time slots for selected date (for rescheduling)
  useEffect(() => {
    if (selectedDate) {
      // Generate mock time slots
      const morningSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
      const afternoonSlots = ['01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'];
      const eveningSlots = ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'];
      
      // Different time slots for different dates to simulate real availability
      const day = new Date(selectedDate).getDay();
      
      let slots = [];
      
      if (day === 0) { // Sunday
        slots = morningSlots.slice(2); // Limited morning hours
      } else if (day === 6) { // Saturday
        slots = [...morningSlots, ...afternoonSlots.slice(0, 2)]; // Morning and early afternoon
      } else if (day % 2 === 0) { // Even weekdays
        slots = [...morningSlots, ...afternoonSlots, ...eveningSlots];
      } else { // Odd weekdays
        slots = [...morningSlots.slice(1), ...afternoonSlots, ...eveningSlots.slice(0, 3)];
      }
      
      setAvailableTimeSlots(slots);
    }
  }, [selectedDate]);

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
  
  // Handle date selection for rescheduling
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };
  
  // Handle time selection for rescheduling
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };
  
  // Confirm rescheduling
  const confirmReschedule = () => {
    if (!selectedDate || !selectedTime) {
      return;
    }
    
    // Update the appointment in our mock data
    const updatedBookings = appointments.map(booking => {
      if (booking.id === selectedAppointment.id) {
        return {
          ...booking,
          date: selectedDate,
          time: selectedTime
        };
      }
      return booking;
    });
    
    setAppointments(updatedBookings);
    setShowRescheduleModal(false);
    
    // Show success message
    alert(`Appointment successfully rescheduled to ${formatDate(selectedDate)} at ${selectedTime}`);
  };
  
  // Handle cancel appointment
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
  
  // Handle view appointment details
  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
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
    // Safely handle undefined or null status
    if (!status) return '';
    
    // Make sure status is a string
    const statusStr = String(status).toLowerCase();
    
    switch (statusStr) {
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
                    {appointment.status}
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
                    <span className="label">Type:</span>
                    <span className="value">{appointment.type || 'Regular'}</span>
                  </div>
                  
                </div>
                <div className="appointment-actions">
                  {(() => {
                    // Safely handle undefined or null status
                    if (!appointment.status) return false;
                    
                    // Make sure status is a string and compare
                    return String(appointment.status).toLowerCase() === 'scheduled';
                  })() && (
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