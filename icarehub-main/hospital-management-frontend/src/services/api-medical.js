import axios from 'axios';
import api from './api';

// Create a base URL for medical API calls
const API_URL = 'http://localhost:5004/api';

// Create a dedicated medical API instance with extended timeout for file operations
const medicalApiInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000 
});

// Add token to requests if it exists
medicalApiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling for medical API
medicalApiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Medical API error:', error);
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          window.location.href = '/signin';
          break;
        case 403:
          console.error('Access forbidden to medical record');
          break;
        case 404:
          console.error('Medical record or file not found');
          break;
        case 500:
          console.error('Server error processing medical request');
          break;
        default:
          break;
      }
    } else if (error.request) {
      console.error('Network error or no response from medical API');
    }
    
    return Promise.reject(error);
  }
);

// Export the medical API functions
export const medicalApi = {
  downloadMedicalFile: (recordId) => {
    console.log(`Downloading medical file for record ID: ${recordId}`);
    return medicalApiInstance.get(`/MedicalRecord/download/${recordId}`, {
      responseType: 'blob',
      // Ensure we capture all response headers to determine content type
      headers: {
        'Accept': '*/*'
      }
    });
  },
  
  // Get a specific medical record with all details
  getMedicalRecord: (recordId) => {
    return medicalApiInstance.get(`/MedicalRecord/${recordId}`);
  },
  
  // Upload a file to attach to a medical record
  uploadMedicalFile: (file, recordId) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return medicalApiInstance.post(`/MedicalRecord/upload?recordId=${recordId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
