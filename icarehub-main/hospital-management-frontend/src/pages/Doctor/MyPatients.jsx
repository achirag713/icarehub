import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import './MyPatients.css';

// Mock patient data
const mockPatients = [
  {
    id: 1,
    name: 'James Wilson',
    age: 45,
    gender: 'Male',
    phone: '(555) 123-4567',
    email: 'james.wilson@example.com',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Emily Davis',
    age: 32,
    gender: 'Female',
    phone: '(555) 234-5678',
    email: 'emily.davis@example.com',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Robert Johnson',
    age: 58,
    gender: 'Male',
    phone: '(555) 345-6789',
    email: 'robert.johnson@example.com',
    status: 'Active'
  },
  {
    id: 4,
    name: 'Sarah Miller',
    age: 29,
    gender: 'Female',
    phone: '(555) 456-7890',
    email: 'sarah.miller@example.com',
    status: 'Active'
  },
  {
    id: 5,
    name: 'Michael Brown',
    age: 64,
    gender: 'Male',
    phone: '(555) 567-8901',
    email: 'michael.brown@example.com',
    status: 'Referred'
  }
];

// Mock medical history data
const mockMedicalHistory = {
  1: [
    {
      id: 1,
      date: '2025-04-15',
      diagnosis: 'Hypertension',
      treatment: 'Prescribed Lisinopril 10mg daily',
      notes: 'Blood pressure reading 140/90. Follow-up in 30 days.'
    }
  ],
  2: [
    {
      id: 1,
      date: '2025-04-10',
      diagnosis: 'Migraine',
      treatment: 'Prescribed Sumatriptan as needed',
      notes: 'Patient reports increasing frequency of migraines.'
    }
  ]
};

const MyPatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [medicalHistory, setMedicalHistory] = useState([]);

  useEffect(() => {
    // Simulating API call with mock data
    setTimeout(() => {
      setPatients(mockPatients);
      setLoading(false);
    }, 800);
  }, [user]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewPatient = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      setMedicalHistory(mockMedicalHistory[patientId] || []);
      setActiveTab('details');
      setIsModalOpen(true);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DoctorLayout>
      <div className="my-patients">
        <div className="page-header">
          <h1>My Patients</h1>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="empty-state">
            <h3>No Patients Found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="patients-grid">
            {filteredPatients.map(patient => (
              <div key={patient.id} className="patient-card">
                <div className="patient-header">
                  <div className="patient-avatar">
                    {getInitials(patient.name)}
                  </div>
                  <div className="patient-info">
                    <h3 className="patient-name">{patient.name}</h3>
                    <span className={`patient-status ${patient.status === 'Active' ? 'status-active' : 'status-referred'}`}>
                      {patient.status}
                    </span>
                  </div>
                </div>
                
                <div className="patient-details">
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{patient.age} years</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{patient.gender}</span>
                  </div>
                </div>
                
                <div className="patient-actions">
                  <button 
                    className="action-button view-button"
                    onClick={() => handleViewPatient(patient.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedPatient && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Patient: ${selectedPatient.name}`}
            size="large"
          >
            <div className="patient-modal-content">
              <div className="modal-tabs">
                <button
                  className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Patient Details
                </button>
                <button
                  className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  Medical History
                </button>
              </div>
              
              <div className="tab-content">
                {activeTab === 'details' && (
                  <div className="patient-details">
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Full Name:</span>
                        <span className="detail-value">{selectedPatient.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Age:</span>
                        <span className="detail-value">{selectedPatient.age} years</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Gender:</span>
                        <span className="detail-value">{selectedPatient.gender}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{selectedPatient.phone}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedPatient.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">{selectedPatient.status}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'history' && (
                  <div className="history-section">
                    {medicalHistory.length > 0 ? (
                      <div className="history-list">
                        {medicalHistory.map((entry) => (
                          <div key={entry.id} className="history-entry">
                            <div className="history-entry-header">
                              <span className="history-date">{entry.date}</span>
                            </div>
                            <div className="history-entry-body">
                              <div className="history-diagnosis">
                                <strong>Diagnosis:</strong> {entry.diagnosis}
                              </div>
                              <div className="history-treatment">
                                <strong>Treatment:</strong> {entry.treatment}
                              </div>
                              <div className="history-notes">
                                <strong>Notes:</strong> {entry.notes}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-history">No medical history available</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DoctorLayout>
  );
};

export default MyPatients;