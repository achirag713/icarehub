import React, { useState, useEffect } from 'react';
import { FaDownload, FaSearch, FaEye } from 'react-icons/fa';
import PatientLayout from '../../layouts/PatientLayout';
import { formatDate } from '../../utils/dateUtils';
import { patient } from '../../services/api';
import './MedicalRecords.css';

const MedicalRecords = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patient.getMedicalRecords();
      setRecords(response.data);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError('Failed to load medical records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRecord(null);
  };

  const getFilteredRecords = () => {
    let filtered = records;
    
    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(record => record.type.toLowerCase() === filter.toLowerCase());
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.doctorName?.toLowerCase().includes(searchLower) ||
        record.diagnosis?.toLowerCase().includes(searchLower) ||
        record.notes?.toLowerCase().includes(searchLower)
      );
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
          <div className="loading">Loading medical records...</div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="medical-records">
        <div className="page-header">
          <h1>Medical Records</h1>
          <div className="filter-controls">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Records
            </button>
            <button
              className={filter === 'diagnosis' ? 'active' : ''}
              onClick={() => setFilter('diagnosis')}
            >
              Diagnosis
            </button>
            <button
              className={filter === 'prescription' ? 'active' : ''}
              onClick={() => setFilter('prescription')}
            >
              Prescriptions
            </button>
            <button
              className={filter === 'lab' ? 'active' : ''}
              onClick={() => setFilter('lab')}
            >
              Lab Results
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="search-container">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                  <h3>{record.title || 'Medical Record'}</h3>
                  <span className={`record-type ${getRecordTypeClass(record.type)}`}>
                    {record.type}
                  </span>
                </div>
                <div className="record-details">
                  <div className="detail-item">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(record.date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Doctor:</span>
                    <span className="value">Dr. {record.doctorName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Summary:</span>
                    <span className="value">{record.summary}</span>
                  </div>
                </div>
                <div className="record-actions">
                  <button
                    className="view-btn"
                    onClick={() => handleViewDetails(record)}
                  >
                    <FaEye /> View Details
                  </button>
                  {record.fileUrl && (
                    <button
                      className="download-btn"
                      onClick={() => window.open(record.fileUrl, '_blank')}
                    >
                      <FaDownload /> Download
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
                <h2>{selectedRecord.title || 'Medical Record Details'}</h2>
                <button className="close-btn" onClick={handleCloseDetails}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Date:</span>
                      <span className="value">{formatDate(selectedRecord.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Type:</span>
                      <span className="value">{selectedRecord.type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Doctor:</span>
                      <span className="value">Dr. {selectedRecord.doctorName}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Details</h3>
                  <div className="details-content">
                    {selectedRecord.diagnosis && (
                      <div className="detail-item">
                        <span className="label">Diagnosis:</span>
                        <span className="value">{selectedRecord.diagnosis}</span>
                      </div>
                    )}
                    {selectedRecord.treatment && (
                      <div className="detail-item">
                        <span className="label">Treatment:</span>
                        <span className="value">{selectedRecord.treatment}</span>
                      </div>
                    )}
                    {selectedRecord.notes && (
                      <div className="detail-item">
                        <span className="label">Notes:</span>
                        <span className="value">{selectedRecord.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRecord.fileUrl && (
                  <div className="detail-section">
                    <h3>Attachments</h3>
                    <a
                      href={selectedRecord.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-btn"
                    >
                      <FaDownload /> Download {selectedRecord.type} Report
                    </a>
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