import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateUtils';
import { patient } from '../../services/api';
import './Dashboard.css';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [bills, setBills] = useState([]);
  const [healthUpdates, setHealthUpdates] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [error, setError] = useState(null);

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
    
    // If it's an object, look for specialization/specialty
    if (doctorObj && typeof doctorObj === 'object') {
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
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch patient profile first
        const profileResponse = await patient.getProfile();
        setPatientProfile(profileResponse.data);

        // Fetch all other data in parallel
        const [appointmentsRes, medicalRecordsRes, billsRes] = await Promise.all([
          patient.getAppointments(),
          patient.getMedicalRecords(),
          patient.getBills()
        ]);

        // Debug appointmentsRes
        console.log('==================== DASHBOARD DOCTOR INFORMATION ====================');
        console.log('Appointments from API:', appointmentsRes.data);
        
        // Add detailed doctor debugging
        if (Array.isArray(appointmentsRes.data)) {
          appointmentsRes.data.forEach((apt, index) => {
            console.log(`Appointment ${index} - Doctor Info:`);
            if (apt.doctor && typeof apt.doctor === 'object') {
              console.log('Doctor Object:', apt.doctor);
              console.log('Doctor Name:', apt.doctor.name);
              console.log('Doctor Specialization:', apt.doctor.specialization);
            } else {
              console.log('Doctor (non-object):', apt.doctor);
            }
            console.log('---------------------------------');
          });
        }
        console.log('====================================================================');
        
        // Set appointments and find next appointment
        const appointmentsData = appointmentsRes.data;
        
        // Ensure appointment times are properly handled
        if (Array.isArray(appointmentsData)) {
          appointmentsData.forEach((apt, index) => {
            console.log(`Appointment ${index}:`, apt);
            console.log(`  Doctor:`, apt.doctor);
            console.log(`  Specialty:`, apt.specialty);
            
            // Use displayTime as primary source of time information
            if (apt.displayTime) {
              apt.time = apt.displayTime;
              console.log(`  Using displayTime: ${apt.displayTime}`);
            }
            // Final fallback: Use the date object's time
            else if (!apt.time && (apt.date || apt.appointmentDate)) {
              const dateString = apt.date || apt.appointmentDate;
              const aptDate = new Date(dateString);
              if (!isNaN(aptDate.getTime())) {
                apt.time = aptDate.toLocaleTimeString([], { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                });
                console.log(`  Fallback time from date: ${apt.time}`);
              }
            }
          });
        }
        
        setAppointments(appointmentsData);
        if (appointmentsData.length > 0) {
          const sortedAppointments = [...appointmentsData].sort((a, b) => 
            new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time)
          );
          console.log('Next appointment:', sortedAppointments[0]);
          setNextAppointment(sortedAppointments[0]);
        }

        // Set medical records
        setMedicalRecords(medicalRecordsRes.data);

        // Set bills
        setBills(billsRes.data);

        // Set health updates from medical records
        const healthUpdatesData = medicalRecordsRes.data
          .filter(record => record.type === 'health_update')
          .map(record => ({
            id: record.id,
            title: record.title,
            value: record.value,
            date: record.createdAt,
            status: record.status
          }));
        setHealthUpdates(healthUpdatesData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  useEffect(() => {
    // Debug: Test the doctor name extraction function with various data structures
    const testDoctorNameExtraction = () => {
      const testCases = [
        { case: "String", doctor: "Dr. Smith" },
        { case: "Object with name", doctor: { name: "Dr. Johnson" } },
        { case: "Object with username", doctor: { username: "DrJones" } },
        { case: "Object with firstName/lastName", doctor: { firstName: "Jane", lastName: "Doe" } },
        { case: "Nested user object", doctor: { user: { name: "Dr. Wilson" } } },
        { case: "Nested user with firstName", doctor: { user: { firstName: "Robert", lastName: "Brown" } } },
        { case: "Only ID", doctor: { id: 123 } },
        { case: "Null", doctor: null },
        { case: "Empty object", doctor: {} }
      ];
      
      console.log("===== DOCTOR NAME EXTRACTION TEST =====");
      testCases.forEach(test => {
        console.log(`Case: ${test.case}`);
        console.log(`  Input:`, test.doctor);
        console.log(`  Output: "${getDoctorName(test.doctor)}"`);
      });
      console.log("======================================");
    };
    
    // Run test in development only
    if (process.env.NODE_ENV === 'development') {
      testDoctorNameExtraction();
    }
  }, []);

  const handleReschedule = (appointmentId) => {
    navigate(`/patient/book-appointments?reschedule=${appointmentId}`);
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await patient.cancelAppointment(appointmentId);
        // Refresh appointments after cancellation
        const response = await patient.getAppointments();
        setAppointments(response.data);
        // Update next appointment
        if (response.data.length > 0) {
          const sortedAppointments = [...response.data].sort((a, b) => 
            new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time)
          );
          setNextAppointment(sortedAppointments[0]);
        } else {
          setNextAppointment(null);
        }
      } catch (error) {
        console.error('Error canceling appointment:', error);
        alert('Failed to cancel appointment. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </PatientLayout>
    );
  }

  // Determine the name to display
  const displayName = (() => {
    // If patient profile is loaded and has a name, use it
    if (patientProfile && patientProfile.name) {
      return patientProfile.name;
    }
    // Otherwise use the name from auth context if available
    if (user?.name) {
      return user.name;
    }
    // Fall back to username if name is not available
    if (user?.username) {
      return user.username;
    }
    // Default fallback
    return 'Patient';
  })();

  return (
    <PatientLayout>
      <div className="patient-dashboard">
        <div className="welcome-section">
          <h1>Welcome, {displayName}</h1>
          <p>Your health dashboard - {formatDate(new Date())}</p>
        </div>

        <div className="dashboard-summary">
          {/* Upcoming Appointments Card */}
          <div className="summary-card">
            <div className="card-header">
              <h2>Upcoming Appointments</h2>
              <Link to="/patient/my-bookings" className="view-all-btn">View All</Link>
            </div>
            <div className="card-content">
              {appointments.length > 0 ? (
                <ul className="summary-list">
                  {appointments.slice(0, 2).map((appointment) => (
                    <li key={appointment.id} className="summary-item">
                      <div className="item-icon appointment-icon">📅</div>
                      <div className="item-details">
                        <h3>{getDoctorName(appointment.doctor)}</h3>
                        <p>{getSpecialty(appointment.doctor, appointment)}</p>
                        <p>{formatDate(appointment.date)} at {appointment.displayTime || appointment.time}</p>
                      </div>
                      <div className="item-status">{appointment.status || 'Scheduled'}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-data">
                  <p>No upcoming appointments.</p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Records Card */}
          <div className="summary-card">
            <div className="card-header">
              <h2>Medical Records</h2>
              <Link to="/patient/medical-records" className="view-all-btn">View All</Link>
            </div>
            <div className="card-content">
              {medicalRecords.length > 0 ? (
                <ul className="summary-list">
                  {medicalRecords.slice(0, 2).map((record) => (
                    <li key={record.id} className="summary-item">
                      <div className="item-icon record-icon">📋</div>
                      <div className="item-details">
                        <h3>{record.title || 'Medical Record'}</h3>
                        <p>Dr. {getDoctorName(record.doctor)}</p>
                        <p>{formatDate(record.date || record.createdAt)}</p>
                      </div>
                      <div className="item-status">{record.type || 'Record'}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-data">
                  <p>No medical records available.</p>
                </div>
              )}
            </div>
          </div>

          {/* Outstanding Bills Card */}
          <div className="summary-card">
            <div className="card-header">
              <h2>Outstanding Bills</h2>
              <Link to="/patient/billings" className="view-all-btn">View All</Link>
            </div>
            <div className="card-content">
              {bills.length > 0 ? (
                <ul className="summary-list">
                  {bills.slice(0, 2).map((bill) => (
                    <li key={bill.id} className="summary-item">
                      <div className="item-icon bill-icon">💳</div>
                      <div className="item-details">
                        <h3>{bill.service}</h3>
                        <p>Due: {formatDate(bill.dueDate)}</p>
                        <p>${bill.amount.toFixed(2)}</p>
                      </div>
                      <div className="item-status">{bill.status}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-data">
                  <p>No outstanding bills.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detail-cards">
          {/* Next Appointment Card */}
          <div className="detail-card next-appointment">
            <div className="card-header">
              <h2>Next Appointment</h2>
            </div>
            <div className="card-content">
              {nextAppointment ? (
                <div className="appointment-details">
                  <div className="appointment-header">
                    <div className="doctor-info">
                      <h3>{getDoctorName(nextAppointment.doctor)}</h3>
                      <p>{getSpecialty(nextAppointment.doctor, nextAppointment)}</p>
                    </div>
                    <div className="appointment-status">{nextAppointment.status || 'Scheduled'}</div>
                  </div>
                  <div className="appointment-time">
                    <div className="date-time">
                      <div className="date-icon">📅</div>
                      <div className="date-details">
                        <p className="label">Date</p>
                        <p className="value">{formatDate(nextAppointment.date)}</p>
                      </div>
                    </div>
                    <div className="date-time">
                      <div className="time-icon">⏰</div>
                      <div className="time-details">
                        <p className="label">Time</p>
                        <p className="value">{nextAppointment.displayTime || nextAppointment.time}</p>
                      </div>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={() => handleReschedule(nextAppointment.id)}
                    >
                      Reschedule
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleCancel(nextAppointment.id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  <p>No upcoming appointments scheduled.</p>
                  <Link to="/patient/book-appointments" className="btn btn-primary">
                    Book an Appointment
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Health Updates Card */}
          <div className="detail-card health-updates">
            <div className="card-header">
              <h2>Recent Health Updates</h2>
            </div>
            <div className="card-content">
              {healthUpdates.length > 0 ? (
                <ul className="health-metrics">
                  {healthUpdates.map((update) => (
                    <li key={update.id} className="health-metric-item">
                      <div className="metric-title">{update.title}</div>
                      <div className="metric-value">{update.value}</div>
                      <div className={`metric-status ${update.status.toLowerCase()}`}>
                        {update.status}
                      </div>
                      <div className="metric-date">{formatDate(update.date)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-data">
                  <p>No recent health updates available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientDashboard;
