import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import { formatDate, combineDateAndTime } from '../../utils/dateUtils';
import { patient } from '../../services/api';
import './BookAppointments.css';
import placeholderImage from '../../assets/hms.png'; // Import a placeholder image

// Available departments
const departments = [
  'Cardiology',
  'Neurology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Ophthalmology',
  'Gynecology',
  'Urology',
  'Dentistry',
  'Psychology'
];




const BookAppointments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  // Initialize selectedDoctor as null to avoid rendering issues
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const doctorId = params.get('doctorId');
    const rescheduleId = params.get('reschedule');

    if (rescheduleId) {
      setIsRescheduling(true);
      fetchAppointmentDetails(rescheduleId);
    } else if (doctorId) {
      fetchDoctorDetails(doctorId);
    }
  }, [location.search]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchDoctors();
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    if (selectedDoctor) {
      generateAvailableDates();
    }
  }, [selectedDoctor]);

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Loop through the next 30 days to find available weekdays
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Only add weekdays (1-5 = Monday to Friday, 0 = Sunday, 6 = Saturday)
      // Note: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
      
      // Stop once we have 14 available dates
      if (dates.length >= 14) {
        break;
      }
    }
    
    // If we didn't get any dates, show a message
    if (dates.length === 0) {
      setError("No available dates found. Please try again later.");
    }
    
    setAvailableDates(dates);
  };

  const fetchAppointmentDetails = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await patient.getAppointments();
      const appointment = response.data.find(apt => apt.id === parseInt(appointmentId));
      
      if (appointment) {
        // Create a clean version of the appointment object without cyclic references
        const cleanAppointment = {
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          reason: appointment.reason,
          notes: appointment.notes
        };
        
        setAppointmentToReschedule(cleanAppointment);
        
        // Make sure we have a valid doctor object with fallbacks
        if (appointment.doctor && typeof appointment.doctor === 'object') {
          // IMPORTANT: Extract only the specific properties we need from the doctor object
          // This prevents React from rendering the entire complex object with circular references
          const normalizedDoctor = {
            id: appointment.doctor.id || appointment.doctor.Id || 0,
            Id: appointment.doctor.Id || appointment.doctor.id || 0,
            name: appointment.doctor.name || appointment.doctor.username || 'Unknown Doctor',
            specialization: appointment.doctor.specialization || 'Specialist',
            profileImage: appointment.doctor.profileImage || null,
            consultationFee: appointment.doctor.consultationFee || 500
          };
          
          // Log the doctor object to help with debugging
          console.log('Normalized doctor from appointment:', normalizedDoctor);
          
          setSelectedDoctor(normalizedDoctor);
          setSelectedDepartment(normalizedDoctor.specialization);
        } else {
          console.error('Invalid doctor object in appointment:', appointment);
          setError('Error loading doctor information. Please try again.');
        }
        
        setSelectedDate(appointment.date || '');
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
      setError('Failed to load appointment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorDetails = async (doctorId) => {
    try {
      setLoading(true);
      const response = await patient.getDoctor(doctorId);
      if (response.data) {
        // Instead of spreading the entire response.data which might contain nested objects
        // or circular references, extract only the properties we need
        const normalizedDoctor = {
          id: response.data.id || response.data.Id || 0,
          Id: response.data.Id || response.data.id || 0,
          name: response.data.name || response.data.username || 'Unknown Doctor',
          specialization: response.data.specialization || 'Specialist',
          profileImage: response.data.profileImage || null,
          consultationFee: response.data.consultationFee || 500
        };
        
        console.log('Normalized doctor from fetch:', normalizedDoctor);
        
        setSelectedDoctor(normalizedDoctor);
        setSelectedDepartment(normalizedDoctor.specialization);
      }
    } catch (err) {
      console.error('Error fetching doctor details:', err);
      setError('Failed to load doctor details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patient.getDoctorsBySpecialization(selectedDepartment);
      
      // Debug the API response
      console.log('API Response - Doctors:', response.data);
      
      // Check if the data is an array
      if (!Array.isArray(response.data)) {
        console.error('Expected doctors data to be an array but got:', typeof response.data);
        setError('Invalid data format received from server. Please try again.');
        setDoctors([]);
        return;
      }
      
      // Map the data to ensure we have normalized doctor objects
      // IMPORTANT: Extract only the specific properties we need
      const normalizedDoctors = response.data.map(doctor => {
        // If doctor is not an object, create a placeholder
        if (!doctor || typeof doctor !== 'object') {
          console.error('Invalid doctor data:', doctor);
          return {
            id: Math.random(), // Generate a random id for the key
            name: 'Unknown Doctor',
            specialization: selectedDepartment || 'Specialist',
            consultationFee: 500,
            profileImage: null
          };
        }
        
        // Debug: Log the raw doctor object from API
        console.log('Raw doctor object from API:', doctor);
        
        // Get username from user object if available
        let userName = '';
        if (doctor.user && typeof doctor.user === 'object') {
          userName = doctor.user.username || '';
          console.log('Found username in user object:', userName);
        }
        
        // Generate a name based on specialization if no real name is available
        let doctorName = doctor.name || doctor.userName || doctor.username || userName;
        if (!doctorName || doctorName === 'Unknown Doctor' || doctorName === 'Doctor') {
          doctorName = `Dr. ${selectedDepartment || 'Specialist'}`;
        }
        
        // Extract only the specific properties we need, never pass the entire doctor object
        // This prevents React from rendering complex nested objects
        return {
          id: doctor.id || doctor.Id || Math.random(),
          name: doctorName,
          specialization: doctor.specialization || selectedDepartment || 'Specialist',
          consultationFee: doctor.consultationFee || 500,
          profileImage: doctor.profileImage || null
        };
      });
      
      console.log('Normalized Doctors:', normalizedDoctors);
      setDoctors(normalizedDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimeSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if the selected date is a weekend
      const selectedDateObj = new Date(selectedDate);
      const dayOfWeek = selectedDateObj.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Saturday or Sunday
        setAvailableTimeSlots([]);
        setError("Doctors are not available on weekends (Saturday and Sunday). Please select a weekday.");
        setLoading(false);
        return;
      }
      
      // Format the date to ISO string
      const formattedDate = selectedDateObj.toISOString().split('T')[0];
      
      // Make sure selectedDoctor.id is a number
      const docId = parseInt(selectedDoctor?.id || 0, 10);
      if (!docId) {
        console.error('Invalid doctor ID for fetching slots:', selectedDoctor);
        setError('Invalid doctor selection. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching available slots for doctor ID: ${docId}, date: ${formattedDate}`);
      
      const response = await patient.getAvailableSlots(docId, formattedDate);
      
      // Validate response data is an array
      if (!Array.isArray(response.data)) {
        console.error('Expected array of time slots but got:', response.data);
        const defaultSlots = generateDefaultTimeSlots(formattedDate);
        setAvailableTimeSlots(defaultSlots);
        return;
      }
      
      if (response.data.length === 0) {
        // If no slots are returned from API, create default slots
        const defaultSlots = generateDefaultTimeSlots(formattedDate);
        setAvailableTimeSlots(defaultSlots);
        return;
      }

      // Format the time slots from the backend
      const formattedSlots = response.data.map(slot => {
        try {
          // Make sure we're dealing with a valid date string 
          if (typeof slot !== 'string' && !(slot instanceof Date)) {
            console.error('Invalid slot format:', slot);
            return null;
          }
          
          const date = new Date(slot);
          if (isNaN(date.getTime())) {
            console.error('Invalid date from slot:', slot);
            return null;
          }
          
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } catch (err) {
          console.error('Error formatting time slot:', err, slot);
          return null;
        }
      }).filter(Boolean); // Remove null values

      setAvailableTimeSlots(formattedSlots);
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Failed to load available time slots. Please try again.');
      
      // Fallback to default slots if the API call fails
      const defaultSlots = generateDefaultTimeSlots(selectedDate);
      setAvailableTimeSlots(defaultSlots);
    } finally {
      setLoading(false);
    }
  };

  // Generate default time slots from 9 AM to 5 PM with 30-minute intervals
  const generateDefaultTimeSlots = (dateString) => {
    const slots = [];
    const date = new Date(dateString);
    const today = new Date();
    
    // Check if the date is a weekend (Saturday = 6, Sunday = 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return []; // Return empty array for weekends
    }
    
    // Start at 9 AM
    date.setHours(9, 0, 0, 0);
    
    // Generate slots until 5 PM (17:00)
    while (date.getHours() < 17) {
      // Skip slots in the past if the date is today
      if (date.toDateString() === today.toDateString() && date < today) {
        date.setMinutes(date.getMinutes() + 30);
        continue;
      }
      
      slots.push(date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));
      
      // Increment by 30 minutes
      date.setMinutes(date.getMinutes() + 30);
    }
    
    return slots;
  };

  const handleDepartmentChange = (e) => {
    const department = e.target.value;
    setSelectedDepartment(department);
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableTimeSlots([]);
  };

  const handleDoctorSelect = (doctor) => {
    if (!doctor) {
      console.error('No doctor object provided to handleDoctorSelect');
      setError('Error selecting doctor. Please try again.');
      return;
    }

    // Log raw doctor object for debugging
    console.log('Raw doctor object in handleDoctorSelect:', doctor);

    // Extract only the specific properties we need, never pass the entire doctor object
    // This prevents React from rendering the entire complex object with potential circular references
    const normalizedDoctor = {
      id: doctor.id || doctor.Id || 0,
      Id: doctor.Id || doctor.id || 0,
      name: doctor.name || doctor.username || (doctor.user?.username) || 'Doctor',
      specialization: doctor.specialization || selectedDepartment || 'Specialist',
      profileImage: doctor.profileImage || null,
      consultationFee: doctor.consultationFee || 500
    };
    
    // Make sure the doctor name is meaningful by generating a valid placeholder if needed
    if (!normalizedDoctor.name || normalizedDoctor.name === 'Doctor' || normalizedDoctor.name === 'Unknown Doctor') {
      normalizedDoctor.name = `Dr. ${normalizedDoctor.specialization}`;
    }
    
    console.log('Selected doctor (normalized):', normalizedDoctor);
    
    setSelectedDoctor(normalizedDoctor);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableTimeSlots([]);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!selectedDoctor || !selectedDate || !selectedTime) {
        setError('Please select a doctor, date, and time');
        setLoading(false);
        return;
      }

      // Get doctor ID
      const doctorId = selectedDoctor.Id || selectedDoctor.id;
      if (!doctorId) {
        setError('Invalid doctor selection');
        setLoading(false);
        return;
      }

      // Save the originally selected time for display
      const displayTime = selectedTime;

      // Use our utility to properly combine date and time
      const appointmentDate = combineDateAndTime(selectedDate, displayTime);
      if (!appointmentDate) {
        setError('Error processing appointment time. Please try again.');
        setLoading(false);
        return;
      }
      
      // Create ISO string for the API
      const appointmentDateISO = appointmentDate.toISOString();
      
      console.log(`Creating appointment for ${selectedDate}`);
      console.log(`User selected time: ${displayTime}`);
      console.log(`Combined date and time: ${appointmentDateISO}`);

      // Create appointment data
      const appointmentData = {
        doctorId: parseInt(doctorId, 10),
        appointmentDate: appointmentDateISO,
        displayTime: displayTime, // Original user-selected time
        localAppointmentTime: displayTime, // Alternative name for the original time
        reason: appointmentReason || "General consultation",
        notes: appointmentNotes || ""
      };

      console.log('Submitting appointment:', appointmentData);

      // Book appointment
      const response = await patient.bookAppointment(appointmentData);
      console.log('Booking success:', response);
      
      setSuccessMessage('Appointment booked successfully!');
      setTimeout(() => {
        navigate('/patient/my-bookings');
      }, 2000);
    } catch (err) {
      console.error('Booking error:', err);
      
      // Log detailed error information
      console.error('ERROR DETAILS:', {
        message: err.message,
        response: err.response,
        data: err.response?.data,
        status: err.response?.status
      });
      
      // Show the exact error message from the server
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else {
          setError(JSON.stringify(err.response.data));
        }
      } else {
        setError('Failed to book appointment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientLayout>
      <div className="book-appointments-page">
        <div className="page-header">
          <h1>{isRescheduling ? 'Reschedule Appointment' : 'Book an Appointment'}</h1>
          <p>Schedule your appointment with our top specialists</p>
        </div>
        
        {successMessage ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Appointment Booked!</h2>
            <p>{successMessage}</p>
            <p>Redirecting to your appointments...</p>
          </div>
        ) : (
          <div className="booking-container">
            <div className="booking-steps">
              <div className={`step ${step >= 1 ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-text">Select Department</div>
              </div>
              <div className="step-connector"></div>
              <div className={`step ${step >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-text">Select Doctor</div>
              </div>
              <div className="step-connector"></div>
              <div className={`step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-text">Choose Date & Time</div>
              </div>
              <div className="step-connector"></div>
              <div className={`step ${step >= 4 ? 'active' : ''}`}>
                <div className="step-number">4</div>
                <div className="step-text">Appointment Details</div>
              </div>
            </div>
            
            <div className="booking-form">
              {/* Step 1: Select Department */}
              {step === 1 && (
                <div className="step-content">
                  <h2>Select a Department</h2>
                  <div className="departments-grid">
                    {departments.map((department) => (
                      <div 
                        key={department} 
                        className={`department-card ${selectedDepartment === department ? 'selected' : ''}`}
                        onClick={() => handleDepartmentChange({ target: { value: department } })}
                      >
                        <div className="department-icon">
                          {/* Simple department icons using emoji */}
                          {department === 'Cardiology' && '❤️'}
                          {department === 'Neurology' && '🧠'}
                          {department === 'Dermatology' && '🧬'}
                          {department === 'Pediatrics' && '👶'}
                          {department === 'Orthopedics' && '🦴'}
                          {department === 'Ophthalmology' && '👁️'}
                          {department === 'Gynecology' && '👩'}
                          {department === 'Urology' && '🧪'}
                          {department === 'Dentistry' && '🦷'}
                          {department === 'Psychology' && '🧠'}
                        </div>
                        <h3>{department}</h3>
                      </div>
                    ))}
                  </div>
                  <div className="step-buttons">
                    <button 
                      className="btn-next"
                      onClick={() => setStep(2)}
                      disabled={!selectedDepartment}
                    >
                      Next: Select Doctor
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Select Doctor */}
              {step === 2 && (
                <div className="step-content">
                  <h2>Select a Doctor from {selectedDepartment}</h2>
                  <div className="doctors-grid">
                    {loading ? (
                      <div className="loading">Loading doctors...</div>
                    ) : doctors.length === 0 ? (
                      <div className="no-doctors-message">
                        <div className="no-doctors-icon">🏥</div>
                        <h3>No Doctors Available</h3>
                        <p>We couldn't find any doctors currently available in the {selectedDepartment} department.</p>
                        <p>Please select a different department or check back later.</p>
                        <button 
                          className="btn-change-department"
                          onClick={() => setStep(1)}
                        >
                          Change Department
                        </button>
                      </div>
                    ) : (
                      doctors.map((doctor, index) => {
                        // Double-check that doctor is an object and not trying to render the entire doctor
                        // If doctor is not a proper object with expected properties, use defaults
                        const doctorName = doctor && typeof doctor === 'object' ? (doctor.name || 'Doctor') : 'Doctor';
                        const doctorSpecialization = doctor && typeof doctor === 'object' ? (doctor.specialization || 'Specialist') : 'Specialist';
                        const doctorFee = doctor && typeof doctor === 'object' ? (doctor.consultationFee || '500') : '500';
                        const doctorId = doctor && typeof doctor === 'object' ? (doctor.id || index) : index;
                        const doctorProfileImage = doctor && typeof doctor === 'object' ? doctor.profileImage : null;
                        
                        return (
                          <div 
                            key={doctorId} 
                            className={`doctor-card ${selectedDoctor?.id === doctorId ? 'selected' : ''}`}
                            onClick={() => handleDoctorSelect(doctor)}
                          >
                            <div className="doctor-image">
                              <img 
                                src={doctorProfileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=random&color=fff&size=150`} 
                                alt={doctorName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=random&color=fff&size=150`;
                                }} 
                              />
                            </div>
                            <div className="doctor-info">
                              <h3>{doctorName}</h3>
                              <p className="specialization">{doctorSpecialization}</p>
                              <p className="fee">Rs. {doctorFee}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="step-buttons">
                    <button 
                      className="btn-back"
                      onClick={() => setStep(1)}
                    >
                      Back: Select Department
                    </button>
                    <button 
                      className="btn-next"
                      onClick={() => setStep(3)}
                      disabled={!selectedDoctor}
                    >
                      Next: Choose Date & Time
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Choose Date & Time */}
              {step === 3 && (
                <div className="step-content">
                  <h2>Choose Date & Time</h2>
                  
                  {selectedDoctor ? (
                    <div className="doctor-selected">
                      <div className="doctor-avatar">
                        {/* Use a variable for the doctor name with fallback */}
                        {(() => {
                          const doctorName = typeof selectedDoctor === 'object' && selectedDoctor !== null
                            ? (selectedDoctor.name || 'Selected Doctor')
                            : 'Selected Doctor';
                          
                          return (
                            <img 
                              src={
                                (typeof selectedDoctor === 'object' && selectedDoctor !== null && selectedDoctor.profileImage)
                                  ? selectedDoctor.profileImage
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=random&color=fff&size=100`
                              } 
                              alt={doctorName}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=random&color=fff&size=100`;
                              }} 
                            />
                          );
                        })()}
                      </div>
                      <div className="doctor-details">
                        <h3>
                          {typeof selectedDoctor === 'object' && selectedDoctor !== null
                            ? (selectedDoctor.name || 'Selected Doctor')
                            : 'Selected Doctor'}
                        </h3>
                        <p>
                          {typeof selectedDoctor === 'object' && selectedDoctor !== null
                            ? (selectedDoctor.specialization || 'Specialist')
                            : 'Specialist'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="error-message">
                      <p>Error: No doctor selected. Please go back and select a doctor.</p>
                      <button 
                        className="btn-back"
                        onClick={() => setStep(2)}
                      >
                        Back to Doctor Selection
                      </button>
                    </div>
                  )}
                  
                  {error && (
                    <div className="error-message">
                      <p>{error}</p>
                    </div>
                  )}
                  
                  <div className="date-selection">
                    <h3>Select Date</h3>
                    <div className="weekend-notice">
                      <span className="weekend-notice-text">Note: Doctors are not available on weekends (Saturday and Sunday)</span>
                    </div>
                    <div className="timezone-notice">
                      <span className="timezone-notice-text">Note: Appointments can only be booked between 9 AM and 5 PM ({Intl.DateTimeFormat().resolvedOptions().timeZone} timezone)</span>
                    </div>
                    <div className="date-grid">
                      {availableDates.map((date) => (
                        <button
                          key={date}
                          className={`date-btn ${selectedDate === date ? 'selected' : ''}`}
                          onClick={() => handleDateSelect(date)}
                        >
                          <span className="day">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="date">{new Date(date).getDate()}</span>
                          <span className="month">{new Date(date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Time Slots Section */}
                  {selectedDate && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Available Time Slots</h3>
                      {loading ? (
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : error ? (
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="flex flex-col items-center">
                            <svg className="w-10 h-5 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="40">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <h4 className="text-lg font-medium text-red-900 mb-1">No Availability</h4>
                            <p className="text-red-500 mb-3">{error}</p>
                            <button
                              onClick={() => setSelectedDate(null)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Select a different date
                            </button>
                          </div>
                        </div>
                      ) : availableTimeSlots.length === 0 ? (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="flex flex-col items-center">
                            <svg className="w-10 h-5 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"  width="40">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"  />
                            </svg>
                            <h4 className="text-lg font-medium text-gray-900 mb-1">No Available Slots</h4>
                            <p className="text-gray-500 mb-3">There are no available time slots for this date.</p>
                            <button
                              onClick={() => setSelectedDate(null)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Select a different date
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {availableTimeSlots.map((time, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 text-center rounded-lg border ${
                                selectedTime === time
                                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="step-buttons">
                    <button 
                      className="btn-back"
                      onClick={() => setStep(2)}
                    >
                      Back: Select Doctor
                    </button>
                    <button 
                      className="btn-next"
                      onClick={() => setStep(4)}
                      disabled={!selectedDate || !selectedTime}
                    >
                      Next: Appointment Details
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 4: Appointment Details */}
              {step === 4 && (
                <div className="step-content">
                  <h2>Appointment Details</h2>
                  
                  {selectedDoctor && selectedDate && selectedTime ? (
                    <>
                      <div className="appointment-summary">
                        <div className="summary-item">
                          <span className="label">Department:</span>
                          <span className="value">{selectedDepartment || 'Not specified'}</span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Doctor:</span>
                          <span className="value">
                            {typeof selectedDoctor === 'object' && selectedDoctor !== null
                              ? (selectedDoctor.name || 'Not specified')
                              : 'Not specified'}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Date:</span>
                          <span className="value">{formatDate(selectedDate) || 'Not specified'}</span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Time:</span>
                          <span className="value">{selectedTime || 'Not specified'}</span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Fee:</span>
                          <span className="value">Rs. {
                            typeof selectedDoctor === 'object' && selectedDoctor !== null
                              ? (selectedDoctor.consultationFee || 500)
                              : 500
                          }</span>
                        </div>
                      </div>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="form-group">
                          <label htmlFor="appointmentReason">Reason for Appointment</label>
                          <textarea
                            id="appointmentReason"
                            value={appointmentReason}
                            onChange={(e) => setAppointmentReason(e.target.value)}
                            placeholder="Please describe your symptoms or reason for visit"
                            rows="4"
                            required
                          ></textarea>
                        </div>

                        <div className="form-group">
                          <label htmlFor="appointmentNotes">Additional Notes (Optional)</label>
                          <textarea
                            id="appointmentNotes"
                            value={appointmentNotes}
                            onChange={(e) => setAppointmentNotes(e.target.value)}
                            placeholder="Any additional information for the doctor"
                            rows="3"
                          ></textarea>
                        </div>
                        
                        <div className="payment-info">
                          <p>Payment will be collected at the hospital during your visit.</p>
                        </div>
                        
                        <div className="step-buttons">
                          <button 
                            className="btn-back"
                            type="button"
                            onClick={() => setStep(3)}
                          >
                            Back: Choose Date & Time
                          </button>
                          <button 
                            className="btn-confirm"
                            type="submit"
                            disabled={loading || !appointmentReason}
                          >
                            {loading ? 'Confirming...' : 'Confirm Appointment'}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="error-message">
                      <p>Missing required information. Please complete all previous steps.</p>
                      <button 
                        className="btn-back"
                        onClick={() => setStep(3)}
                      >
                        Back to Date & Time Selection
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
};

export default BookAppointments;