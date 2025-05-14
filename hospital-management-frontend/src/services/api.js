import axios from 'axios';

const API_URL = 'https://localhost:7203/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error status codes
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          window.location.href = '/signin';
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

// Patient API endpoints
export const patient = {
  // Profile
  getProfile: () => api.get('/Patient/profile'),
  updateProfile: (data) => api.put('/Patient/profile', data),
  changePassword: (data) => api.put('/Patient/change-password', data),
  updateNotificationPreferences: (data) => api.put('/Patient/notification-preferences', data),

  // Doctors
  getAllDoctors: () => api.get('/Doctor').then(response => {
    // Normalize the doctor data
    if (Array.isArray(response.data)) {
      // Make sure each doctor object has expected properties and format
      response.data = response.data.map(doctor => {
        if (!doctor || typeof doctor !== 'object') return null;
        
        return {
          id: doctor.id || 0,
          name: doctor.name || doctor.username || 'Unknown Doctor',
          username: doctor.username || doctor.name || 'Unknown Doctor',
          email: doctor.email || '',
          phoneNumber: doctor.phoneNumber || '',
          specialization: doctor.specialization || 'Specialist',
          consultationFee: doctor.consultationFee || 500,
          profileImage: doctor.profileImage || null
        };
      }).filter(Boolean); // Remove any null entries
    }
    return response;
  }),
  getDoctor: (id) => api.get(`/Doctor/${id}`).then(response => {
    // Normalize single doctor data
    if (response.data && typeof response.data === 'object') {
      const doctor = response.data;
      response.data = {
        id: doctor.id || 0,
        name: doctor.name || doctor.username || 'Unknown Doctor',
        username: doctor.username || doctor.name || 'Unknown Doctor',
        email: doctor.email || '',
        phoneNumber: doctor.phoneNumber || '',
        specialization: doctor.specialization || 'Specialist',
        consultationFee: doctor.consultationFee || 500,
        profileImage: doctor.profileImage || null
      };
    }
    return response;
  }),
  getDoctorsBySpecialization: (specialization) => api.get(`/Doctor/specialization/${specialization}`).then(response => {
    // Normalize the doctor data
    if (Array.isArray(response.data)) {
      // Make sure each doctor object has expected properties and format
      response.data = response.data.map(doctor => {
        if (!doctor || typeof doctor !== 'object') return null;
        
        return {
          id: doctor.id || 0,
          name: doctor.name || doctor.username || 'Unknown Doctor',
          specialization: doctor.specialization || 'Specialist',
          consultationFee: doctor.consultationFee || 500,
          profileImage: doctor.profileImage || null
        };
      }).filter(Boolean); // Remove any null entries
    }
    return response;
  }),

  // Appointments
  getAppointments: () => api.get('/Appointment/patient').then(response => {
    // Debug: Log the raw appointment data
    console.log('RAW APPOINTMENT DATA FROM SERVER:', JSON.stringify(response.data, null, 2));
    
    // Normalize appointment data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(appointment => {
        if (!appointment || typeof appointment !== 'object') return null;
        
        // Debug: Log each appointment with its raw doctor info
        console.log('=============================================');
        console.log('PROCESSING APPOINTMENT:', appointment.id);
        console.log('DOCTOR PROPERTY:', appointment.doctor);
        console.log('DOCTOR NAME PROPERTY:', appointment.doctorName);
        console.log('DISPLAY TIME PROPERTY:', appointment.displayTime);
        console.log('============= DOCTOR NAME EXTRACTION =============');
        
        // Check for doctorName first before anything else
        if (appointment.doctorName) {
          console.log('Found doctorName directly on appointment:', appointment.doctorName);
        }
        
        // Handle various possible doctor data structures
        let doctorName = 'Doctor';  // Changed default from 'Unknown Doctor' to just 'Doctor'
        let specialty = 'Specialist';
        let doctorObj = null;
        
        // First priority: Use doctorName if it exists directly on the appointment
        if (appointment.doctorName && appointment.doctorName.trim() !== '') {
          doctorName = appointment.doctorName;
          specialty = appointment.doctorSpecialization || appointment.specialty || 'Specialist';
          
          console.log('Using doctorName directly from appointment:', doctorName);
          
          // Create a basic doctor object with the doctorName from the server
          doctorObj = {
            id: appointment.doctorId || 0,
            name: doctorName,
            specialization: specialty
          };
          
          console.log('Created doctorObj from direct properties:', doctorObj);
        }
        // Second priority: Use doctor object
        else if (appointment.doctor) {
          // Debug the doctor object
          console.log('Using doctor object:', appointment.doctor);
          
          if (typeof appointment.doctor === 'string') {
            doctorName = appointment.doctor;
            
            // Create a basic doctor object when doctor is just a string
            doctorObj = {
              id: 0,
              name: doctorName,
              specialization: specialty
            };
            console.log('Created doctorObj from string doctor:', doctorObj);
          } else if (typeof appointment.doctor === 'object') {
            // Handle various name formats for better display
            const firstName = appointment.doctor.firstName || '';
            const lastName = appointment.doctor.lastName || '';
            const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : '';
            
            // Access User property if it exists
            let userName = '';
            if (appointment.doctor.user && typeof appointment.doctor.user === 'object') {
              userName = appointment.doctor.user.username || '';
              console.log('Found userName in nested user object:', userName);
            }
            
            // Create a normalized doctor object with fallbacks for all needed properties
            doctorObj = {
              id: appointment.doctor.id || appointment.doctor.Id || 0,
              name: appointment.doctor.name || 
                    appointment.doctor.username || 
                    userName ||
                    fullName || 
                    'Doctor',
              specialization: appointment.doctor.specialization || appointment.doctor.specialty || 'Specialist'
            };
            
            // Ensure doctor name is never empty after normalization
            if (!doctorObj.name || doctorObj.name.trim() === '') {
              doctorObj.name = 'Doctor';
            }
            
            doctorName = doctorObj.name;
            specialty = doctorObj.specialization;
            console.log('Created doctorObj from object doctor:', doctorObj);
          }
        }
        // Third priority: Default doctor object
        else {
          // Create a default doctor object if no data available
          doctorObj = {
            id: 0,
            name: 'Doctor',
            specialization: 'Specialist'
          };
          console.log('Using default doctorObj as no doctor info found');
        }
        
        console.log('FINAL DOCTOR NAME:', doctorName);
        console.log('=============================================');
        
        // Parse date and time from appointment
        let appointmentDate = appointment.date || appointment.appointmentDate;
        
        // Get appointment time - with displayTime as the priority source
        let appointmentTime = appointment.displayTime || appointment.time;
        
        // Debug the time extraction
        console.log('TIME EXTRACTION:');
        console.log('  DisplayTime:', appointment.displayTime);
        console.log('  Time property:', appointment.time);
        
        // Last fallback: Extract time from the date
        if (!appointmentTime && appointmentDate) {
          try {
            const dateObj = new Date(appointmentDate);
            if (!isNaN(dateObj.getTime())) {
              appointmentTime = dateObj.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              });
              console.log('  Fallback time from date:', appointmentTime);
            }
          } catch (e) {
            console.error('Error parsing appointment date/time:', e);
          }
        }
        
        if (!appointmentTime) {
          appointmentTime = '12:00 PM'; // Default fallback
          console.log('  Using default time:', appointmentTime);
        }
        
        // Create a normalized appointment object
        const normalizedAppointment = {
          id: appointment.id || 0,
          date: appointmentDate || new Date().toISOString().split('T')[0],
          time: appointmentTime,
          displayTime: appointment.displayTime || appointmentTime, // Keep original displayTime if available
          doctor: doctorObj, // Use the normalized doctor object
          specialty: specialty,
          status: appointment.status || 'Scheduled',
          reason: appointment.reason || appointment.purpose || 'Consultation',
          notes: appointment.notes || '',
          type: appointment.type || 'Regular'
        };
        
        // Debug: Log the normalized appointment and doctor name
        console.log('FINAL NORMALIZED APPOINTMENT:', {
          id: normalizedAppointment.id,
          doctorName: normalizedAppointment.doctor.name,
          specialty: normalizedAppointment.specialty,
          date: normalizedAppointment.date,
          time: normalizedAppointment.time,
          displayTime: normalizedAppointment.displayTime
        });
        
        return normalizedAppointment;
      }).filter(Boolean); // Remove any null entries
    }
    return response;
  }),
  getAvailableSlots: (doctorId, date) => api.get(`/Appointment/available-slots/${doctorId}?date=${date}`)
    .then(response => {
      // Check if the response contains valid data
      if (!response.data) return response;
      
      // If it's an array of time slots, everything is fine
      if (Array.isArray(response.data)) {
        return response;
      }
      
      // If we got an object instead of an array, log it and return an empty array
      console.error('Expected array of time slots but got:', response.data);
      response.data = [];
      return response;
    }),
  bookAppointment: (data) => {
    // USE DISPLAYTIME FIELD - This uses the proper database column
    
    // Extract the real selected time for display
    const selectedTime = data.localAppointmentTime || data.displayTime || "12:00 PM";
    
    // Create appointment data
    const appointmentData = {
      doctorId: parseInt(data.doctorId, 10),
      appointmentDate: data.appointmentDate,
      displayTime: selectedTime, // Set the display time in its own field
      reason: data.reason || "General consultation",
      notes: data.notes || ""
    };
    
    console.log('Sending appointment with DisplayTime field:', appointmentData);
    
    // Try the simplified endpoint first
    return api.post('/Appointment/simplified', appointmentData)
      .catch(error => {
        console.log('Simplified endpoint failed, trying original endpoint:', error);
        return api.post('/Appointment', appointmentData);
      });
  },
  cancelAppointment: (id) => api.put(`/Appointment/${id}/cancel`),

  // Medical Records
  getMedicalRecords: () => api.get('/MedicalRecord/patient').then(response => {
    // Debug: Log the raw medical record data
    console.log('Raw medical records from API:', response.data);
    
    // Normalize medical records data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(record => {
        if (!record || typeof record !== 'object') return null;
        
        // Debug: Log each record to see its structure
        console.log('Processing medical record:', record);
        
        // Extract doctor information safely
        let doctorName = 'Unknown';
        let doctorObj = null;
        
        // First priority: Use doctorName if it exists directly on the record
        if (record.doctorName) {
          doctorName = record.doctorName;
          
          // Create a basic doctor object when doctor is just a string
          doctorObj = {
            id: 0,
            name: doctorName,
            specialization: 'Specialist'
          };
        }
        // Second priority: Use doctor object
        else if (record.doctor) {
          // Debug the doctor object
          console.log('Doctor object in medical record:', record.doctor);
          
          if (typeof record.doctor === 'string') {
            doctorName = record.doctor;
            
            // Create a basic doctor object when doctor is just a string
            doctorObj = {
              id: 0,
              name: doctorName,
              specialization: 'Specialist'
            };
          } else if (typeof record.doctor === 'object') {
            // Handle various name formats for better display
            const firstName = record.doctor.firstName || '';
            const lastName = record.doctor.lastName || '';
            const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : '';
            
            // Create a normalized doctor object with fallbacks for all needed properties
            doctorObj = {
              id: record.doctor.id || record.doctor.Id || 0,
              name: record.doctor.name || 
                    record.doctor.username || 
                    fullName || 
                    'Doctor',
              specialization: record.doctor.specialization || record.doctor.specialty || 'Specialist'
            };
            
            // Ensure doctor name is never empty after normalization
            if (!doctorObj.name || doctorObj.name.trim() === '') {
              doctorObj.name = 'Doctor';
            }
            
            doctorName = doctorObj.name;
          }
        }
        // Third priority: Default doctor object
        else {
          // Create a default doctor object if no data available
          doctorObj = {
            id: 0,
            name: 'Doctor',
            specialization: 'Specialist'
          };
          doctorName = 'Doctor';
        }
        
        return {
          id: record.id || 0,
          title: record.title || record.diagnosis || 'Medical Record',
          doctor: doctorObj, // Use normalized doctor object
          date: record.date || record.createdAt || new Date().toISOString(),
          type: record.type || 'Record',
          status: record.status || 'Completed',
          value: record.value || ''
        };
      }).filter(Boolean); // Remove any null entries
    }
    return response;
  }),
  getMedicalRecord: (id) => api.get(`/MedicalRecord/${id}`),
  getPrescriptions: () => api.get('/MedicalRecord/patient/prescriptions'),
  getLabResults: () => api.get('/MedicalRecord/patient/lab-results'),

  // Billing
  getBills: () => api.get('/Billing/patient').then(response => {
    // Normalize billing data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(bill => {
        if (!bill || typeof bill !== 'object') return null;
        
        return {
          id: bill.id || 0,
          service: bill.service || bill.description || 'Medical Service',
          amount: typeof bill.amount === 'number' ? bill.amount : parseFloat(bill.amount) || 0,
          dueDate: bill.dueDate || bill.date || new Date().toISOString(),
          status: bill.status || 'Unpaid'
        };
      }).filter(Boolean); // Remove any null entries
    }
    return response;
  }),
  getBill: (id) => api.get(`/Billing/${id}`),
  payBill: (id, paymentData) => api.post(`/Billing/${id}/pay`, paymentData),
};

// Doctor API endpoints
export const doctor = {
  getProfile: () => api.get('/Doctor/profile'),
  updateProfile: (data) => api.put('/Doctor/profile', data),
  getPatients: () => api.get('/Doctor/patients').then(response => {
    // Normalize the patient data
    if (Array.isArray(response.data)) {
      // Make sure each patient object has expected properties and format
      response.data = response.data.map(patient => {
        if (!patient || typeof patient !== 'object') return null;
        
        // Extract only the properties we need
        return {
          id: patient.id || 0,
          firstName: patient.firstName || patient.name?.split(' ')[0] || 'Unknown',
          lastName: patient.lastName || patient.name?.split(' ')[1] || '',
          email: patient.email || '',
          phoneNumber: patient.phoneNumber || '',
          gender: patient.gender || 'Not specified',
          lastVisit: patient.lastVisit || new Date().toISOString(),
          patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient'
        };
      }).filter(Boolean); // Remove any null entries
    }
    return response;
  }),
  getAppointments: () => api.get('/Doctor/appointments').then(response => {
    // Normalize appointment data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(appointment => {
        if (!appointment || typeof appointment !== 'object') return null;
        
        return {
          id: appointment.id || 0,
          date: appointment.date || appointment.appointmentDate || new Date().toISOString(),
          patientName: appointment.patientName || 
            (appointment.patient && typeof appointment.patient === 'object' ? 
              `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim() : 
              'Unknown Patient'),
          purpose: appointment.purpose || appointment.reason || 'Consultation',
          status: appointment.status || 'Scheduled'
        };
      }).filter(Boolean);
    }
    return response;
  }),
  getMedicalRecords: (patientId) => api.get(`/Doctor/patients/${patientId}/medical-records`).then(response => {
    // Normalize medical records data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(record => {
        if (!record || typeof record !== 'object') return null;
        
        return {
          id: record.id || 0,
          patientName: record.patientName || 'Unknown Patient',
          diagnosis: record.diagnosis || 'Not specified',
          createdAt: record.createdAt || record.date || new Date().toISOString()
        };
      }).filter(Boolean);
    }
    return response;
  }),
  updateAppointment: (id, data) => api.put(`/Appointment/${id}`, data),
};

// Admin API endpoints
export const admin = {
  // Doctor management
  getDoctors: () => api.get('/Doctor').then(response => {
    // Normalize doctor data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(doctor => {
        if (!doctor || typeof doctor !== 'object') return null;
        
        return {
          id: doctor.id || 0,
          firstName: doctor.firstName || doctor.name?.split(' ')[0] || 'Unknown',
          lastName: doctor.lastName || doctor.name?.split(' ')[1] || '',
          specialization: doctor.specialization || 'Specialist',
          email: doctor.email || '',
          phoneNumber: doctor.phoneNumber || '',
          licenseNumber: doctor.licenseNumber || '',
          address: doctor.address || ''
        };
      }).filter(Boolean);
    }
    return response;
  }),
  createDoctor: (data) => api.post('/Doctor', data),
  updateDoctor: (id, data) => api.put(`/Doctor/${id}`, data),
  deleteDoctor: (id) => api.delete(`/Doctor/${id}`),

  // Patient management
  getPatients: () => api.get('/Patient').then(response => {
    // Normalize patient data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(patient => {
        if (!patient || typeof patient !== 'object') return null;
        
        return {
          id: patient.id || 0,
          firstName: patient.firstName || patient.name?.split(' ')[0] || 'Unknown',
          lastName: patient.lastName || patient.name?.split(' ')[1] || '',
          email: patient.email || '',
          phoneNumber: patient.phoneNumber || '',
          gender: patient.gender || 'Not specified',
          lastVisit: patient.lastVisit || new Date().toISOString()
        };
      }).filter(Boolean);
    }
    return response;
  }),
  updatePatient: (id, data) => api.put(`/Patient/${id}`, data),
  deletePatient: (id) => api.delete(`/Patient/${id}`),

  // Appointment management
  getAppointments: () => api.get('/Appointment').then(response => {
    // Normalize appointment data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(appointment => {
        if (!appointment || typeof appointment !== 'object') return null;
        
        const patientName = appointment.patientName || 
          (appointment.patient && typeof appointment.patient === 'object' ? 
            `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim() : 
            'Unknown Patient');
            
        const doctorName = appointment.doctorName || 
          (appointment.doctor && typeof appointment.doctor === 'object' ? 
            `${appointment.doctor.firstName || ''} ${appointment.doctor.lastName || ''}`.trim() : 
            'Unknown Doctor');
            
        return {
          id: appointment.id || 0,
          date: appointment.date || appointment.appointmentDate || new Date().toISOString(),
          patientName: patientName,
          doctorName: doctorName,
          status: appointment.status || 'Scheduled'
        };
      }).filter(Boolean);
    }
    return response;
  }),
  getAllAppointments: () => api.get('/Appointment/all'),
  createAppointment: (data) => api.post('/Appointment', data),
  updateAppointment: (id, data) => api.put(`/Appointment/${id}`, data),
  deleteAppointment: (id) => api.delete(`/Appointment/${id}`),

  // Billing management
  addBill: (data) => api.post('/Billing', data),
  getBills: () => api.get('/Billing'),
  getBill: (id) => api.get(`/Billing/${id}`),
  updateBill: (id, data) => api.put(`/Billing/${id}`, data),
  
  // Admin profile and settings
  getProfile: () => api.get('/Admin/profile'),
  updateProfile: (data) => api.put('/Admin/profile', data),
  changePassword: (data) => api.post('/Admin/change-password', data),
  getSystemSettings: () => api.get('/Admin/settings'),
  updateSystemSettings: (data) => api.put('/Admin/settings', data),
  
  // Dashboard data
  getDashboardStats: () => api.get('/Admin/dashboard-stats').then(response => {
    // Ensure we have default values for stats
    if (response.data && typeof response.data === 'object') {
      response.data = {
        totalPatients: response.data.totalPatients || 0,
        totalDoctors: response.data.totalDoctors || 0,
        totalAppointments: response.data.totalAppointments || 0,
        totalRevenue: response.data.totalRevenue || 0
      };
    } else {
      response.data = {
        totalPatients: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        totalRevenue: 0
      };
    }
    return response;
  }),
  getRecentAppointments: () => api.get('/Admin/recent-appointments').then(response => {
    // Normalize appointment data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(appointment => {
        if (!appointment || typeof appointment !== 'object') return null;
        
        return {
          id: appointment.id || 0,
          date: appointment.date || appointment.appointmentDate || new Date().toISOString(),
          patientName: appointment.patientName || 'Unknown Patient',
          doctorName: appointment.doctorName || 'Unknown Doctor',
          status: appointment.status || 'Scheduled'
        };
      }).filter(Boolean);
    } else {
      response.data = [];
    }
    return response;
  }),
  getRecentPatients: () => api.get('/Admin/recent-patients').then(response => {
    // Normalize patient data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(patient => {
        if (!patient || typeof patient !== 'object') return null;
        
        return {
          id: patient.id || 0,
          firstName: patient.firstName || patient.name?.split(' ')[0] || 'Unknown',
          lastName: patient.lastName || patient.name?.split(' ')[1] || '',
          gender: patient.gender || 'Not specified',
          lastVisit: patient.lastVisit || new Date().toISOString()
        };
      }).filter(Boolean);
    } else {
      response.data = [];
    }
    return response;
  }),
  getRecentDoctors: () => api.get('/Admin/recent-doctors').then(response => {
    // Normalize doctor data
    if (Array.isArray(response.data)) {
      response.data = response.data.map(doctor => {
        if (!doctor || typeof doctor !== 'object') return null;
        
        return {
          id: doctor.id || 0,
          firstName: doctor.firstName || doctor.name?.split(' ')[0] || 'Unknown',
          lastName: doctor.lastName || doctor.name?.split(' ')[1] || '',
          specialization: doctor.specialization || 'Specialist'
        };
      }).filter(Boolean);
    } else {
      response.data = [];
    }
    return response;
  })
};

// Auth API endpoints
export const auth = {
  signin: (data) => api.post('/Auth/signin', data),
  signup: (data) => api.post('/Auth/signup', data),
  forgotPassword: (data) => api.post('/Auth/forgot-password', data),
  verifyOTP: (data) => api.post('/Auth/verify-otp', data),
  resetPassword: (data) => api.post('/Auth/reset-password', data),
};

export default api;