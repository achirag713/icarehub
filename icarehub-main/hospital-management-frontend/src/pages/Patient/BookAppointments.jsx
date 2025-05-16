import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import { formatDate } from '../../utils/dateUtils';
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
  const [currentDate] = useState(new Date().toISOString().split('T')[0]); // Today's date for comparison
  const [existingAppointments, setExistingAppointments] = useState([]); // Store all current appointments
  
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
    
    // Fetch all current appointments for the patient to show existing ones
    fetchCurrentAppointments();
  }, [location.search]);
  
  // Fetch all current appointments for the patient
  const fetchCurrentAppointments = async () => {
    try {
      const response = await patient.getAppointments();
      if (response.data && Array.isArray(response.data)) {
        // Filter to only scheduled appointments
        const scheduledAppointments = response.data
          .filter(apt => apt.status === 'Scheduled' || apt.status === 'scheduled')
          .map(apt => {
            // Normalize date format to match the format used in the date picker (YYYY-MM-DD)
            let normalizedDate = apt.date;
            let originalDate = apt.date; // Store original date for debugging
            
            // Skip if date is missing or invalid
            if (!apt.date) {
              return {
                ...apt,
                date: null,
                originalDate: null
              };
            }
            
            try {
              // Method 1: Handle ISO format with T separator (2023-01-15T00:00:00.000Z)
              if (apt.date.includes('T')) {
                normalizedDate = apt.date.split('T')[0];
              } 
              // Method 2: Handle MM/DD/YYYY format
              else if (apt.date.includes('/')) {
                const parts = apt.date.split('/');
                if (parts.length === 3) {
                  normalizedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                }
              }
              // Method 3: Try to ensure valid YYYY-MM-DD format using Date object
              const dateObj = new Date(apt.date);
              if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                
                // Only override if we can successfully parse it to a valid date
                const dateFromObj = `${year}-${month}-${day}`;
                
                // If our previous normalization didn't work, use this as fallback
                if (normalizedDate === apt.date) {
                  normalizedDate = dateFromObj;
                }
                
                // Store the normalized version from Date object for additional comparisons
                apt.dateObject = dateFromObj;
              }
            } catch (e) {
              console.error(`Error normalizing date for appointment ID ${apt.id}:`, e);
              // Keep original if there's an error
              normalizedDate = apt.date;
            }
            
            console.log(`Normalized appointment date: ${apt.date} -> ${normalizedDate}`);
            
            return {
              ...apt,
              date: normalizedDate,
              originalDate: originalDate,
              dateToString: new Date(apt.date).toDateString() // Add date string representation for easy comparison
            };
          });
        
        setExistingAppointments(scheduledAppointments);
        console.log('Scheduled appointments with normalized dates:', scheduledAppointments);
      }
    } catch (err) {
      console.error('Error fetching current appointments:', err);
      // Don't show error to user, this is just extra context
    }
  };

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
          time: appointment.time || appointment.displayTime,
          displayTime: appointment.displayTime || appointment.time,
          status: appointment.status,
          reason: appointment.reason,
          notes: appointment.notes,
          doctor: appointment.doctor && typeof appointment.doctor === 'object' ? {
            name: appointment.doctor.name || 'Unknown Doctor',
            specialization: appointment.doctor.specialization || 'Specialist'
          } : null
        };
        
        setAppointmentToReschedule(cleanAppointment);
        setAppointmentReason(appointment.reason || '');
        setSelectedTime(appointment.time || appointment.displayTime || '');
        
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

  // Utility function to compare dates with flexibility for different formats
  const areDatesEqual = (date1, date2) => {
    // Handle case when either date is missing
    if (!date1 || !date2) return false;
    
    // Check 1: Direct string comparison (fastest)
    if (date1 === date2) return true;
    
    // Check 2: Split T format (for ISO dates)
    if (date1.includes('T') && date1.split('T')[0] === date2) return true;
    if (date2.includes('T') && date2.split('T')[0] === date1) return true;
    
    // Check 3: Convert MM/DD/YYYY to YYYY-MM-DD and compare
    if (date1.includes('/')) {
      const parts = date1.split('/');
      if (parts.length === 3) {
        const reformatted = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        if (reformatted === date2) return true;
      }
    }
    
    if (date2.includes('/')) {
      const parts = date2.split('/');
      if (parts.length === 3) {
        const reformatted = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        if (reformatted === date1) return true;
      }
    }
    
    // Check 4: Use JavaScript Date objects for the most flexible comparison
    try {
      const date1Obj = new Date(date1);
      const date2Obj = new Date(date2);
      
      // Ensure both dates are valid
      if (!isNaN(date1Obj.getTime()) && !isNaN(date2Obj.getTime())) {
        // Compare the date parts only (year, month, day), ignoring time
        return date1Obj.toDateString() === date2Obj.toDateString();
      }
    } catch (e) {
      console.error('Error comparing dates:', e);
    }
    
    return false;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    
    // Call debug function to help identify date format issues
    debugAppointmentDates();
    
    // Use our utility function to find matching appointments
    const appointmentsOnDate = existingAppointments.filter(apt => areDatesEqual(apt.date, date));
    
    if (appointmentsOnDate.length > 0) {
      console.log(`Found ${appointmentsOnDate.length} appointments on ${date} using our enhanced comparison:`, appointmentsOnDate);
    } else {
      console.log(`No existing appointments found for date: ${date} using our enhanced comparison`);
      console.log('All existing appointments:', existingAppointments.map(apt => ({
        id: apt.id,
        date: apt.date,
        originalDate: apt.originalDate,
        dateToString: apt.dateToString,
        dateObject: apt.dateObject
      })));
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    
    // If we have a doctor and date, check availability when time is selected
    if (selectedDoctor && selectedDate && time) {
      checkTimeAvailability(time);
    }
  };
  
  // Function to check if the selected time is available
  const checkTimeAvailability = async (time) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get doctor ID
      const doctorId = selectedDoctor.Id || selectedDoctor.id;
      if (!doctorId) {
        setError('Invalid doctor selection');
        setLoading(false);
        return;
      }
      
      // Prepare the date
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(12, 0, 0, 0); // Noon exactly
      const appointmentDateISO = appointmentDate.toISOString();
      
      // Get the appointmentId if rescheduling
      const appointmentId = isRescheduling && appointmentToReschedule ? appointmentToReschedule.id : 0;
      
      // Call the API to check availability
      const response = await patient.checkAppointmentAvailability(
        doctorId, 
        appointmentDateISO, 
        time,
        appointmentId
      );
      
      // If not available, show a warning
      if (response.data && !response.data.isAvailable) {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      // Don't show an error here, as this is just a check
    } finally {
      setLoading(false);
    }
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

      // Parse the selected time into hours and minutes
      const timeParts = selectedTime.match(/(\d+):(\d+)\s*([AP]M)/i);
      if (!timeParts) {
        setError("Invalid time format selected");
        setLoading(false);
        return;
      }
      
      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      const isPM = timeParts[3].toUpperCase() === 'PM';
      
      // Convert 12-hour format to 24-hour format
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }
      
      // Create the appointment date with the correct time
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      // Create ISO string for the API
      const appointmentDateISO = appointmentDate.toISOString();
      
      console.log(`Creating appointment for ${selectedDate}`);
      console.log(`User selected time: ${displayTime}`);
      console.log(`Using actual time in date: ${appointmentDateISO}`);
      console.log(`Hours: ${hours}, Minutes: ${minutes}`);
      
      // Check availability one more time before submitting
      const appointmentId = isRescheduling && appointmentToReschedule ? appointmentToReschedule.id : 0;
      const availabilityResponse = await patient.checkAppointmentAvailability(
        doctorId, 
        appointmentDateISO, 
        displayTime,
        appointmentId
      );
      
      if (availabilityResponse.data && !availabilityResponse.data.isAvailable) {
        setError(availabilityResponse.data.message);
        setLoading(false);
        return;
      }

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

      let response;
      
      // If rescheduling, use the reschedule endpoint
      if (isRescheduling && appointmentToReschedule) {
        response = await patient.rescheduleAppointment(appointmentToReschedule.id, appointmentData);
        console.log('Rescheduling success:', response);
        setSuccessMessage('Appointment rescheduled successfully!');
      } else {
        // Otherwise book a new appointment
        response = await patient.bookAppointment(appointmentData);
        console.log('Booking success:', response);
        setSuccessMessage('Appointment booked successfully!');
      }
      
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

  // Add a debug function to help troubleshoot date format issues
  const debugAppointmentDates = () => {
    console.log('DEBUG - All Appointments:', existingAppointments);
    console.log('DEBUG - Current Selected Date:', selectedDate);
    
    // Enhanced date comparison checks
    existingAppointments.forEach(apt => {
      // Convert dates to JS Date objects for consistent comparison
      const aptDate = apt.date ? new Date(apt.date) : null;
      const selDate = selectedDate ? new Date(selectedDate) : null;
      
      // Check if valid dates
      const aptDateValid = aptDate && !isNaN(aptDate.getTime());
      const selDateValid = selDate && !isNaN(selDate.getTime());
      
      // Check for different comparison results
      const exactMatch = apt.date === selectedDate;
      const dateObjMatch = aptDateValid && selDateValid ? 
        aptDate.toDateString() === selDate.toDateString() : false;
      
      // Try normalized formats
      const aptFormatted = aptDateValid ? aptDate.toISOString().split('T')[0] : null;
      const selFormatted = selDateValid ? selDate.toISOString().split('T')[0] : null;
      const normalizedMatch = aptFormatted && selFormatted ? aptFormatted === selFormatted : false;
      
      // Detailed debug information
      console.log(`Appointment ID: ${apt.id}, 
        Date: ${apt.date}, 
        Original Date: ${apt.originalDate || 'N/A'}, 
        Exact Match: ${exactMatch ? 'YES' : 'NO'}, 
        Date Object Match: ${dateObjMatch ? 'YES' : 'NO'}, 
        Normalized Match: ${normalizedMatch ? 'YES' : 'NO'},
        JS Conversion: ${aptDateValid ? aptDate.toDateString() : 'INVALID'} vs ${selDateValid ? selDate.toDateString() : 'INVALID'}`);
    });
    
    // Try different matching approaches
    const exactMatches = existingAppointments.filter(apt => apt.date === selectedDate);
    console.log(`DEBUG - Exact matches for ${selectedDate}:`, exactMatches);
    
    const dateObjMatches = existingAppointments.filter(apt => {
      const aptDate = apt.date ? new Date(apt.date) : null;
      const selDate = selectedDate ? new Date(selectedDate) : null;
      return aptDate && selDate && !isNaN(aptDate.getTime()) && !isNaN(selDate.getTime()) && 
             aptDate.toDateString() === selDate.toDateString();
    });
    console.log(`DEBUG - Date object matches for ${selectedDate}:`, dateObjMatches);
    
    // Final determination of matching appointments using our enhanced criteria
    const matchingAppointments = existingAppointments.filter(apt => {
      // Try exact match
      if (apt.date === selectedDate) return true;
      
      // Try comparing just the date part (YYYY-MM-DD)
      if (apt.date) {
        // Handle format with T separator (ISO)
        if (apt.date.includes('T')) {
          const datePart = apt.date.split('T')[0];
          if (datePart === selectedDate) return true;
        }
        
        // Handle date with slashes
        if (apt.date.includes('/')) {
          const parts = apt.date.split('/');
          // Convert MM/DD/YYYY to YYYY-MM-DD
          if (parts.length === 3) {
            const reformatted = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            if (reformatted === selectedDate) return true;
          }
        }
        
        // Try comparing just the raw date strings
        const aptDate = new Date(apt.date);
        const selectedDateObj = new Date(selectedDate);
        if (!isNaN(aptDate.getTime()) && !isNaN(selectedDateObj.getTime())) {
          if (aptDate.toDateString() === selectedDateObj.toDateString()) return true;
        }
      }
      
      return false;
    });
    
    console.log(`DEBUG - Final matching appointments for ${selectedDate}:`, matchingAppointments);
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
                  
                  {/* Add reschedule alert banner */}
                  {isRescheduling && (
                    <div className="mb-5 p-4 rounded-lg bg-amber-50 border border-amber-300">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-md font-semibold text-amber-800">You are rescheduling an appointment</h3>
                          <div className="mt-1 text-sm text-amber-700">
                            <p>Please select a new date and time for your appointment. Your original appointment will be cancelled once you confirm the new schedule.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                      {availableDates.map((date) => {
                        // Use our utility function to find appointments on this date
                        const appointmentsOnDate = existingAppointments.filter(apt => areDatesEqual(apt.date, date));
                        const hasAppointmentOnDate = appointmentsOnDate.length > 0;
                        
                        return (
                          <button
                            key={date}
                            className={`date-btn ${selectedDate === date ? 'selected' : ''} ${hasAppointmentOnDate ? 'has-appointment' : ''}`}
                            onClick={() => handleDateSelect(date)}
                          >
                            <span className="day">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="date">{new Date(date).getDate()}</span>
                            <span className="month">{new Date(date).toLocaleDateString('en-US', { month: 'short' })}</span>
                            {hasAppointmentOnDate && (
                              <span className="appointment-dot" 
                                    title={`You have ${appointmentsOnDate.length} appointment(s) on this date`}>
                                {appointmentsOnDate.length > 1 ? appointmentsOnDate.length : ''}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Time Slots Section */}
                  {selectedDate && (
                    <div className="mb-6">
                      {/* Show current appointment info when rescheduling */}
                      {isRescheduling && appointmentToReschedule && (
                        <div className="mb-5 p-4 rounded-lg bg-yellow-50 border border-yellow-300">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-md font-semibold text-yellow-800">Rescheduling Appointment</h4>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p className="font-medium">Current appointment details:</p>
                                <ul className="mt-1 list-disc list-inside pl-2">
                                  <li>Date: {formatDate(appointmentToReschedule.date)}</li>
                                  <li>Time: {appointmentToReschedule.time || appointmentToReschedule.displayTime}</li>
                                  <li>Doctor: {appointmentToReschedule.doctor?.name || 'Unknown Doctor'}</li>
                                  <li>Reason: {appointmentToReschedule.reason || 'Not specified'}</li>
                                </ul>
                                <p className="mt-2">Please select a new date and time below.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show same-day appointment notification */}
                      {selectedDate === currentDate && (
                        <div className="mb-5 p-4 rounded-lg bg-blue-50 border border-blue-300">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-md font-semibold text-blue-800">Same-day Appointment</h4>
                              <div className="mt-1 text-sm text-blue-700">
                                <p>You are booking an appointment for today. Please select an available time slot below.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show existing appointments for the selected date */}
                      {!isRescheduling && selectedDate && (() => {
                        // Find appointments for the selected date using our utility function
                        const matchingAppointments = existingAppointments.filter(apt => areDatesEqual(apt.date, selectedDate));
                          
                        // Log for debugging
                        console.log(`Found ${matchingAppointments.length} appointments matching ${selectedDate}`, matchingAppointments);
                          
                        return matchingAppointments.length > 0 ? (
                          <div className="mb-5 p-4 rounded-lg bg-green-50 border border-green-300">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3 w-full">
                                <h4 className="text-md font-semibold text-green-800">You already have appointment(s) on this date</h4>
                                <div className="mt-2 text-sm text-green-700">
                                  <p className="font-medium">Your existing appointment(s) on {formatDate(selectedDate)}:</p>
                                  <div className="mt-3 space-y-3">
                                    {matchingAppointments.map((apt, index) => (
                                      <div key={index} className="p-3 bg-white rounded-md border border-green-200 shadow-sm">
                                        <p className="font-medium text-green-800">{apt.time || apt.displayTime || 'Time not specified'}</p>
                                        <p><strong>Doctor:</strong> {apt.doctor?.name || 'Not specified'}</p>
                                        <p><strong>Department:</strong> {apt.doctor?.specialization || apt.specialty || 'Not specified'}</p>
                                        <p><strong>Reason:</strong> {apt.reason || 'Not specified'}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}

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
                              onClick={() => handleTimeSelect(time)}
                              className={`p-3 text-center rounded-lg border ${
                                selectedTime === time
                                  ? error
                                    ? 'bg-red-50 border-red-500 text-red-700'
                                    : 'bg-blue-50 border-blue-500 text-blue-700'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              {time}
                              {selectedTime === time && error && (
                                <div className="text-xs text-red-600 mt-1">
                                  Not available
                                </div>
                              )}
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