import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import './Appointments.css';
import { useAuth } from '../../context/AuthContext';
import { doctor } from '../../services/api';

// Mock data for appointments
const mockAppointments = {
  upcoming: [
  {
    id: 1,
      patientName: 'James Wilson',
      patientId: 1,
      date: '2025-04-20',
      time: '10:00 AM',
      type: 'Follow-up',
      status: 'Scheduled',
      reason: 'Hypertension follow-up'
  },
  {
    id: 2,
      patientName: 'Emily Davis',
      patientId: 2,
      date: '2025-04-21',
      time: '2:30 PM',
      type: 'New Visit',
      status: 'Scheduled',
      reason: 'Migraine consultation'
    }
  ],
  completed: [
  {
    id: 3,
      patientName: 'Robert Johnson',
      patientId: 3,
      date: '2025-04-15',
      time: '11:00 AM',
      type: 'Follow-up',
      status: 'Completed',
      reason: 'Diabetes check-up',
      diagnosis: 'Type 2 Diabetes',
      prescription: 'Metformin 500mg twice daily',
      notes: 'Blood sugar levels stable. Continue current medication.',
      hasLabResult: false
  },
  {
    id: 4,
      patientName: 'Sarah Miller',
      patientId: 4,
      date: '2025-04-14',
      time: '3:00 PM',
      type: 'New Visit',
      status: 'Completed',
      reason: 'Anxiety consultation',
      diagnosis: 'Generalized Anxiety Disorder',
      prescription: 'Sertraline 50mg daily',
      notes: 'Patient reports increased anxiety due to work stress.',
      hasLabResult: false
    }
  ],
  cancelled: [
  {
    id: 5,
    patientName: 'Michael Brown',
      patientId: 5,
      date: '2025-04-16',
      time: '9:30 AM',
      type: 'Follow-up',
      status: 'Cancelled',
      reason: 'Arthritis follow-up',
      cancellationReason: 'Patient requested cancellation'
    }
  ]
};

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    notes: '',
    status: 'Scheduled'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [prescription, setPrescription] = useState({
    diagnosis: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    notes: '',
    followUpDate: ''
  });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState(mockAppointments.upcoming);
  const [isLabResultModalOpen, setIsLabResultModalOpen] = useState(false);
  const [selectedLabAppointment, setSelectedLabAppointment] = useState(null);
  const [labResultFile, setLabResultFile] = useState(null);
  const [labResultError, setLabResultError] = useState('');
  
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await doctor.getAppointments();
      setAppointments(response.data);
      setFilteredAppointments(response.data.filter(a => a.status === 'Scheduled'));
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    try {
      await doctor.updateAppointment(selectedAppointment.id, formData);
      setShowModal(false);
      fetchAppointments();
      resetForm();
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Failed to update appointment. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      notes: '',
      status: 'Scheduled'
    });
    setSelectedAppointment(null);
  };

  const openModal = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      notes: appointment.notes || '',
      status: appointment.status
    });
    setShowModal(true);
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    if (appointment.status === 'Completed') {
      setPrescription({
        diagnosis: appointment.diagnosis || '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
        notes: appointment.notes || '',
        followUpDate: ''
      });
    }
    setIsLabResultModalOpen(true);
  };
  
  const handleCancelClick = (appointment) => {
    setAppointmentToCancel(appointment);
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    if (appointmentToCancel) {
      const updatedAppointments = {
        ...appointments,
        upcoming: appointments.upcoming.filter(apt => apt.id !== appointmentToCancel.id),
        cancelled: [
          ...appointments.cancelled,
          {
            ...appointmentToCancel,
            status: 'Cancelled',
            cancellationReason: 'Cancelled by doctor'
          }
        ]
      };
      setAppointments(updatedAppointments);
      setShowCancelConfirm(false);
      setAppointmentToCancel(null);
    }
  };

  const handleCancelClose = () => {
    setShowCancelConfirm(false);
    setAppointmentToCancel(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilteredAppointments(appointments.filter(a => a.status === tab));
    setSearchQuery(''); // Reset search when changing tabs
  };

  const handleAddPrescription = () => {
    if (!prescription.diagnosis.trim()) return;
    
    const updatedAppointments = {
      ...appointments,
      completed: appointments.completed.map(apt => 
        apt.id === selectedAppointment.id
          ? {
              ...apt,
              diagnosis: prescription.diagnosis,
              prescription: prescription.medications.map(med => 
                `${med.name} - ${med.dosage}, ${med.frequency} for ${med.duration}`
              ).join('; '),
              notes: prescription.notes
            }
          : apt
      )
    };
    setAppointments(updatedAppointments);
    setIsLabResultModalOpen(true);
  };

  const handleAddMedication = () => {
    setPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...prescription.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setPrescription(prev => ({
      ...prev,
      medications: updatedMedications
    }));
  };

  const handleRemoveMedication = (index) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleLabResultClick = (appointment) => {
    setSelectedLabAppointment(appointment);
    setIsLabResultModalOpen(true);
  };

  const handleLabResultFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setLabResultFile(file);
      setLabResultError('');
    } else {
      setLabResultFile(null);
      setLabResultError('Please upload a PDF file');
    }
  };

  const handleLabResultUpload = async () => {
    if (!labResultFile) {
      setLabResultError('Please select a file to upload');
      return;
    }

    try {
      await doctor.uploadLabResult(selectedLabAppointment.id, labResultFile);
      setIsLabResultModalOpen(false);
      setLabResultFile(null);
      setSelectedLabAppointment(null);
    } catch (error) {
      console.error('Error uploading lab result:', error);
      setLabResultError('Failed to upload lab result');
    }
  };

  const renderAppointmentCard = (appointment) => {
        return (
      <div key={appointment.id} className="appointment-card">
        <div className="appointment-header">
          <div className="patient-info">
            <h3>{appointment.patientName}</h3>
            <span className={`appointment-type ${appointment.type.toLowerCase().replace(' ', '-')}`}>
              {appointment.type}
            </span>
          </div>
          <span className={`appointment-status ${appointment.status.toLowerCase()}`}>
            {appointment.status}
          </span>
        </div>
        
        <div className="appointment-details">
          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{appointment.date}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Time:</span>
            <span className="detail-value">{appointment.time}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Reason:</span>
            <span className="detail-value">{appointment.reason}</span>
          </div>
        </div>
        
        <div className="appointment-actions">
          <button 
            className="action-button view-button"
            onClick={() => handleViewDetails(appointment)}
          >
            View Details
          </button>
          {appointment.status === 'Scheduled' && (
            <button 
              className="action-button cancel-button"
              onClick={() => handleCancelClick(appointment)}
            >
              Cancel
            </button>
          )}
          {appointment.status === 'Completed' && (
            <button 
              className="action-button lab-result-button"
              onClick={() => handleLabResultClick(appointment)}
            >
              {appointment.hasLabResult ? 'Update Lab Result' : 'Upload Lab Result'}
            </button>
          )}
        </div>
          </div>
        );
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <DoctorLayout>
      <div className="appointments-page">
        <div className="page-header">
          <h1>Appointments</h1>
        </div>
        
        {/* Filter controls */}
        <div className="filter-controls">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        {/* Appointments Tabs */}
        <div className="appointments-tabs">
          <button
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => handleTabChange('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => handleTabChange('completed')}
          >
            Completed
          </button>
          <button
            className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => handleTabChange('cancelled')}
          >
            Cancelled
          </button>
        </div>
        
        {/* Appointments Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <p>No appointments found.</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {filteredAppointments.map(renderAppointmentCard)}
          </div>
        )}
        
        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <Modal 
            isOpen={showModal} 
            onClose={() => setShowModal(false)}
            title={`Update Appointment - ${selectedAppointment.patientName}`}
            size="large"
          >
            <div className="appointment-modal-content">
              <div className="appointment-info">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{selectedAppointment.date}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Time:</span>
                    <span className="info-value">{selectedAppointment.time}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{selectedAppointment.type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value">{selectedAppointment.status}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Reason:</span>
                    <span className="info-value">{selectedAppointment.reason}</span>
                  </div>
                  {selectedAppointment.status === 'Cancelled' && (
                    <div className="info-item">
                      <span className="info-label">Cancellation Reason:</span>
                      <span className="info-value">{selectedAppointment.cancellationReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedAppointment.status === 'Completed' && (
                <div className="prescription-form">
                  <h3>Add/Edit Prescription</h3>
                  <div className="form-group">
                    <label htmlFor="diagnosis">Diagnosis</label>
                    <input
                      type="text"
                      id="diagnosis"
                      value={prescription.diagnosis}
                      onChange={(e) => setPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
                      placeholder="Enter diagnosis"
                      required
                    />
                  </div>

                  <div className="medications-section">
                    <h4>Medications</h4>
                    {prescription.medications.map((med, index) => (
                      <div key={index} className="medication-item">
                        <div className="medication-row">
                          <div className="form-group">
                            <label>Medication Name</label>
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                              placeholder="Enter medication name"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Dosage</label>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                              placeholder="e.g., 500mg"
                              required
                            />
                          </div>
                        </div>
                        <div className="medication-row">
                          <div className="form-group">
                            <label>Frequency</label>
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                              placeholder="e.g., twice daily"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Duration</label>
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                              placeholder="e.g., 7 days"
                              required
                            />
                          </div>
                          {index > 0 && (
                            <button
                              className="remove-medication"
                              onClick={() => handleRemoveMedication(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      className="add-medication"
                      onClick={handleAddMedication}
                    >
                      Add Another Medication
                    </button>
              </div>

                  <div className="form-group">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      value={prescription.notes}
                      onChange={(e) => setPrescription(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter any additional notes"
                      rows="4"
                    />
              </div>

                  <div className="form-actions">
                    <Button
                      variant="primary"
                      onClick={handleAddPrescription}
                      disabled={!prescription.diagnosis.trim()}
                    >
                      Save Prescription
                    </Button>
              </div>
              </div>
              )}
              </div>
          </Modal>
        )}

        {/* Lab Result Upload Modal */}
        {selectedLabAppointment && (
          <Modal
            isOpen={isLabResultModalOpen}
            onClose={() => {
              setIsLabResultModalOpen(false);
              setLabResultFile(null);
              setSelectedLabAppointment(null);
              setLabResultError('');
            }}
            title="Upload Lab Result"
            size="small"
          >
            <div className="lab-result-modal">
              <div className="patient-info">
                <h3>{selectedLabAppointment.patientName}</h3>
                <p>Date: {selectedLabAppointment.date}</p>
                <p>Reason: {selectedLabAppointment.reason}</p>
              </div>
              
              <div className="upload-section">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleLabResultFileChange}
                  className="file-input"
                />
                {labResultError && (
                  <div className="error-message">{labResultError}</div>
                )}
              </div>
              
              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsLabResultModalOpen(false);
                    setLabResultFile(null);
                    setSelectedLabAppointment(null);
                    setLabResultError('');
                  }}
                >
                  Cancel
                </Button>
                    <Button
                      variant="primary"
                  onClick={handleLabResultUpload}
                  disabled={!labResultFile}
                >
                  Upload
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && appointmentToCancel && (
          <Modal
            isOpen={showCancelConfirm}
            onClose={handleCancelClose}
            title="Cancel Appointment"
            size="small"
          >
            <div className="cancel-confirmation">
              <p>Are you sure you want to cancel this appointment?</p>
              <div className="appointment-summary">
                <p><strong>Patient:</strong> {appointmentToCancel.patientName}</p>
                <p><strong>Date:</strong> {appointmentToCancel.date}</p>
                <p><strong>Time:</strong> {appointmentToCancel.time}</p>
                <p><strong>Type:</strong> {appointmentToCancel.type}</p>
                <p><strong>Reason:</strong> {appointmentToCancel.reason}</p>
              </div>
              <div className="modal-actions">
                    <Button
                  variant="secondary"
                  onClick={handleCancelClose}
                >
                  No, Keep Appointment
                </Button>
                    <Button
                      variant="danger"
                  onClick={handleCancelConfirm}
                >
                  Yes, Cancel Appointment
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DoctorLayout>
  );
};

export default DoctorAppointments;