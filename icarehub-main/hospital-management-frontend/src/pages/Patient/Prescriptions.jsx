import React, { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { formatDate } from '../../utils/dateUtils';
import { patient } from '../../services/api';
import './Prescriptions.css';

const Prescriptions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired'

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patient.getPrescriptions();
      setPrescriptions(response.data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (prescription) => {
    setSelectedPrescription(prescription);
    setShowModal(true);
  };

  const getFilteredPrescriptions = () => {
    const now = new Date();
    
    switch (filter) {
      case 'active':
        return prescriptions.filter(prescription => {
          const endDate = new Date(prescription.endDate);
          return endDate >= now;
        });
      case 'expired':
        return prescriptions.filter(prescription => {
          const endDate = new Date(prescription.endDate);
          return endDate < now;
        });
      default:
        return prescriptions;
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="prescriptions">
          <div className="loading">Loading prescriptions...</div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="prescriptions">
        <div className="page-header">
          <h1>My Prescriptions</h1>
          <div className="filter-controls">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'active' ? 'active' : ''}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={filter === 'expired' ? 'active' : ''}
              onClick={() => setFilter('expired')}
            >
              Expired
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="prescriptions-list">
          {getFilteredPrescriptions().length === 0 ? (
            <div className="no-prescriptions">
              <p>No prescriptions found.</p>
            </div>
          ) : (
            getFilteredPrescriptions().map(prescription => (
              <div key={prescription.id} className="prescription-card">
                <div className="prescription-header">
                  <h3>Prescription #{prescription.id}</h3>
                  <span className="date">{formatDate(prescription.prescribedDate)}</span>
                </div>
                <div className="prescription-summary">
                  <div className="doctor-info">
                    <strong>Doctor:</strong> Dr. {prescription.doctor ? prescription.doctor.user.username : 'Unknown'}
                  </div>
                  <div className="medications-summary">
                    <strong>Medications:</strong> {prescription.medications ? prescription.medications.length : 0} medication(s)
                  </div>
                </div>
                <div className="prescription-actions">
                  <button
                    className="view-details-btn"
                    onClick={() => openModal(prescription)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && selectedPrescription && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Prescription Details</h2>
                <button className="close-btn" onClick={() => {
                  setShowModal(false);
                  setSelectedPrescription(null);
                }}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Date Prescribed:</span>
                      <span className="value">{formatDate(selectedPrescription.prescribedDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">End Date:</span>
                      <span className="value">{formatDate(selectedPrescription.endDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Doctor:</span>
                      <span className="value">Dr. {selectedPrescription.doctor ? selectedPrescription.doctor.user.username : 'Unknown'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Department:</span>
                      <span className="value">{selectedPrescription.doctor ? selectedPrescription.doctor.specialization : 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Medications</h3>
                  <div className="medications-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Medication</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescription.medications && selectedPrescription.medications.map((medication, index) => (
                          <tr key={index}>
                            <td>{medication.name}</td>
                            <td>{medication.dosage}</td>
                            <td>{medication.frequency}</td>
                            <td>{medication.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedPrescription.notes && (
                  <div className="detail-section">
                    <h3>Additional Notes</h3>
                    <p>{selectedPrescription.notes}</p>
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

export default Prescriptions;