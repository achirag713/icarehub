import React, { useState, useEffect } from 'react';
import { FaDownload, FaSearch, FaEye, FaPrescription, FaNotesMedical, FaFileAlt, FaFileMedical, FaCalendarAlt, FaUserMd } from 'react-icons/fa';
import PatientLayout from '../../layouts/PatientLayout';
import { formatDate } from '../../utils/dateUtils';
import { patient } from '../../services/api';
import { medicalApi } from '../../services/api-medical';
import { 
  normalizeMedicalRecord, 
  formatPrescription, 
  formatNotes,
  getPrescriptionSummary,
  getDiagnosisSummary 
} from '../../utils/medicalRecordUtils';
import './MedicalRecords.css';

// Medical Records component for patient's secure viewing system

const MedicalRecords = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalContent, setModalContent] = useState('diagnosis'); // 'diagnosis', 'prescription', 'notes'
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patient.getMedicalRecords();
      console.log('Medical Records data received:', response.data);
      
      // If records exist, normalize them using our utility function
      if (response.data && response.data.length > 0) {
        console.log('Sample record structure:', JSON.stringify(response.data[0], null, 2));
        
        // Normalize the records to ensure consistent field names
        const normalizedRecords = response.data
          .map(record => normalizeMedicalRecord(record))
          .filter(Boolean); // Remove any null entries
        
        // Log normalized sample
        console.log('Normalized record sample:', normalizedRecords[0]);
        console.log('Record date available?', normalizedRecords[0].recordDate ? 'Yes' : 'No');
        console.log('Diagnosis available?', normalizedRecords[0].diagnosis ? 'Yes' : 'No');
        console.log('Prescription available?', normalizedRecords[0].prescription ? 'Yes' : 'No');
        
        setRecords(normalizedRecords);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError('Failed to load medical records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record, contentType = 'diagnosis') => {
    // Make sure we have a valid record before displaying
    if (!record || !record.id) {
      showNotification('Unable to display record details. Invalid record data.', 'error');
      return;
    }
    
    setSelectedRecord(record);
    setModalContent(contentType);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRecord(null);
    setModalContent('diagnosis');
  };
  
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };
  
  const handleFileDownload = async (recordId) => {
    try {
      // Show loading state
      const btnId = recordId.toString().includes('modal') ? recordId : `download-btn-${recordId}`;
      const downloadBtn = document.getElementById(btnId);
      const originalText = downloadBtn?.innerHTML;
      
      if (downloadBtn) {
        downloadBtn.innerHTML = '<span class="spinner">↻</span> Downloading...';
        downloadBtn.disabled = true;
      }
      
      console.log('Attempting to download medical record file, ID:', recordId);
      
      // Use the medicalApi to download the file
      const response = await medicalApi.downloadMedicalFile(recordId);
      
      if (!response?.data) {
        throw new Error('No file data received');
      }
      
      // Determine file extension based on content type if available
      const contentType = response.headers?.['content-type'] || 'application/octet-stream';
      let fileExtension = 'pdf'; // Default
      
      if (contentType.includes('pdf')) {
        fileExtension = 'pdf';
      } else if (contentType.includes('image')) {
        fileExtension = 'jpg';
      } else if (contentType.includes('zip')) {
        fileExtension = 'zip';
      }
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical_record_${recordId}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
        
        // Restore button state
        const btnId = recordId.toString().includes('modal') ? recordId : `download-btn-${recordId}`;
        const downloadBtn = document.getElementById(btnId);
        
        if (downloadBtn) {
          downloadBtn.innerHTML = originalText;
          downloadBtn.disabled = false;
        }
        
        // Show success notification
        showNotification('File downloaded successfully', 'success');
      }, 100);
    } catch (err) {
      console.error('Error downloading file:', err);
      
      // Show error notification
      showNotification('Failed to download the file. Please try again later.', 'error');
      
      // Restore button state on error
      const btnId = recordId.toString().includes('modal') ? recordId : `download-btn-${recordId}`;
      const downloadBtn = document.getElementById(btnId);
      
      if (downloadBtn) {
        downloadBtn.innerHTML = '<svg class="icon-margin-right" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path></svg> Download File';
        downloadBtn.disabled = false;
      }
    }
  };

  const getFilteredRecords = () => {
    if (!records || records.length === 0) {
      return [];
    }
    
    let filtered = records;
    
    // Apply search filter
    if (searchTerm) {
      const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term.trim() !== '');
      
      if (searchTerms.length > 0) {
        filtered = filtered.filter(record => {
          // Check if all search terms match at least one field
          return searchTerms.every(term => 
            record.doctor?.name?.toLowerCase().includes(term) ||
            record.doctor?.specialization?.toLowerCase().includes(term) ||
            record.diagnosis?.toLowerCase().includes(term) ||
            record.notes?.toLowerCase().includes(term) ||
            record.prescription?.toLowerCase().includes(term) ||
            formatDate(record.recordDate).toLowerCase().includes(term)
          );
        });
      }
    }
    
    return filtered;
  };

  const getRecordTypeClass = (type) => {
    switch (type.toLowerCase()) {
      case 'diagnosis':
        return 'type-diagnosis';
      case 'prescription':
        return 'type-prescription';
      case 'lab':
        return 'type-lab';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="medical-records">
          <div className="page-header">
            <h1>Medical Records</h1>
          </div>
          <div className="loading">
            <span className="spinner">↻</span> Loading medical records...
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="medical-records">
        <div className="page-header">
          <h1>Medical Records</h1>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.type === 'success' && <span role="img" aria-label="success">✅</span>}
            {notification.type === 'error' && <span role="img" aria-label="error">❌</span>}
            {notification.message}
          </div>
        )}

        <div className="search-container">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by doctor, diagnosis, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search medical records"
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="search-status">
              Found {getFilteredRecords().length} {getFilteredRecords().length === 1 ? 'record' : 'records'} matching "{searchTerm}"
            </div>
          )}
        </div>

        <div className="records-list">
          {getFilteredRecords().length === 0 ? (
            <div className="no-records">
              <p>No medical records found.</p>
            </div>
          ) : (
            getFilteredRecords().map(record => (
              <div key={record.id} className="record-card">
                <div className="record-header">
                  <h3>
                    <FaFileMedical className="icon-margin-right" /> 
                    Medical Record 
                  </h3>
                  <span className="record-date">
                    <FaCalendarAlt className="icon-margin-right" /> 
                     {formatDate(record.recordDate)}
                  </span>
                </div>
                <div className="record-details">
                  <div className="detail-item">
                    <span className="label">
                      <FaUserMd className="icon-margin-right" /> Doctor:
                    </span>
                    <span className="value">
                      Dr. {record.doctor?.name || 'Not specified'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Specialty:</span>
                    <span className="value">
                      {record.doctor?.specialization || 'Not specified'}
                    </span>
                  </div>
                  <div className="detail-item diagnosis-summary">
                    <span className="label">Diagnosis:</span>
                    <span className="value">
                      {record.diagnosis}
                    </span>
                  </div>
                  {record.prescription && (
                    <div className="detail-item prescription-summary">
                      <span className="label">Prescription:</span>
                      <span className="value">
                        {getPrescriptionSummary(record.prescription)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="record-actions">
                  <button
                    className="view-btn prescription-btn"
                    onClick={() => handleViewDetails(record, 'prescription')}
                  >
                    <FaPrescription className="icon-margin-right" /> View Prescription
                  </button>
                  <button
                    className="view-btn notes-btn"
                    onClick={() => handleViewDetails(record, 'notes')}
                  >
                    <FaNotesMedical className="icon-margin-right" /> View Notes
                  </button>
                  {record.filePath && (
                    <button
                      id={`download-btn-${record.id}`}
                      className="download-btn"
                      onClick={() => handleFileDownload(record.id)}
                    >
                      <FaDownload className="icon-margin-right" /> Download Report
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {showDetails && selectedRecord && (
          <div className="record-details-modal">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-tabs">
                  <button 
                    className={`tab-btn ${modalContent === 'prescription' ? 'active' : ''}`}
                    onClick={() => setModalContent('prescription')}
                  >
                    <FaPrescription className="icon-margin-right" /> Prescription
                  </button>
                  <button 
                    className={`tab-btn ${modalContent === 'notes' ? 'active' : ''}`}
                    onClick={() => setModalContent('notes')}
                  >
                    <FaNotesMedical className="icon-margin-right" /> Notes
                  </button>
                </div>
                <button className="close-btn" onClick={handleCloseDetails}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="detail-section record-info">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label"><FaCalendarAlt className="icon-margin-right" /> Date:</span>
                      <span className="value">{formatDate(selectedRecord.recordDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label"><FaUserMd className="icon-margin-right" /> Doctor:</span>
                      <span className="value">Dr. {selectedRecord.doctor?.name || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Specialty:</span>
                      <span className="value">{selectedRecord.doctor?.specialization || 'Not specified'}</span>
                    </div>
                  </div>
                </div>                  {modalContent === 'diagnosis' && (
                  <div className="detail-section">
                    <h3><FaFileAlt className="icon-margin-right" /> Diagnosis</h3>
                    <div className="detailed-content">
                      {selectedRecord.diagnosis ? (
                        <div className="medical-text">
                          {selectedRecord.diagnosis.includes('\n') ?
                            selectedRecord.diagnosis.split('\n').map((paragraph, i) => (
                              <p key={i}>{paragraph}</p>
                            )) :
                            <p>{selectedRecord.diagnosis}</p>
                          }
                        </div>
                      ) : (
                        <div className="empty-content">No diagnosis information available</div>
                      )}
                    </div>
                  </div>
                )}

                {modalContent === 'prescription' && (
                  <div className="detail-section">
                    <h3><FaPrescription className="icon-margin-right" /> Prescription</h3>
                    <div className="detailed-content">
                      {selectedRecord.prescription ? (
                        <div className="medical-text prescription">
                          {formatPrescription(selectedRecord.prescription).map((item, i) => (
                            <p key={i}>• {item}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-content">No prescription information available</div>
                      )}
                    </div>
                  </div>
                )}

                {modalContent === 'notes' && (
                  <div className="detail-section">
                    <h3><FaNotesMedical className="icon-margin-right" /> Medical Notes</h3>
                    <div className="detailed-content">
                      {selectedRecord.notes ? (
                        <div className="medical-text">
                          {formatNotes(selectedRecord.notes).map((item, i) => (
                            <p key={i}>• {item}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-content">No additional notes available</div>
                      )}
                    </div>
                  </div>
                )}

                {selectedRecord.filePath && (
                  <div className="detail-section">
                    <h3>Attachments</h3>
                    <button
                      id={`download-btn-${selectedRecord.id}-modal`}
                      className="download-btn full-width"
                      onClick={() => handleFileDownload(selectedRecord.id)}
                    >
                      <FaDownload className="icon-margin-right" /> Download Medical Report
                    </button>
                  </div>
                )}

                {selectedRecord.labResults && modalContent === 'diagnosis' && (
                  <div className="detail-section">
                    <h3>Lab Results</h3>
                    <div className="detailed-content">
                      <div className="medical-text">
                        {selectedRecord.labResults.split('\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
};

export default MedicalRecords;