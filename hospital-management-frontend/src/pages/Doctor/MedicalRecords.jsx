import React, { useState, useEffect } from 'react';
import { doctor } from '../../services/api';
import './MedicalRecords.css';

const MedicalRecords = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    followUpDate: ''
  });

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const response = await doctor.getMedicalRecords();
      setMedicalRecords(response.data);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError('Failed to load medical records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      await doctor.createMedicalRecord(formData);
      setShowModal(false);
      fetchMedicalRecords();
      resetForm();
    } catch (err) {
      console.error('Error creating medical record:', err);
      setError('Failed to create medical record. Please try again.');
    }
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    try {
      await doctor.updateMedicalRecord(selectedRecord.id, formData);
      setShowModal(false);
      fetchMedicalRecords();
      resetForm();
    } catch (err) {
      console.error('Error updating medical record:', err);
      setError('Failed to update medical record. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      followUpDate: ''
    });
    setSelectedRecord(null);
  };

  const openModal = (record = null) => {
    if (record) {
      setSelectedRecord(record);
      setFormData({
        patientId: record.patientId,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        notes: record.notes,
        followUpDate: record.followUpDate ? record.followUpDate.split('T')[0] : ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading medical records...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="medical-records-container">
      <div className="page-header">
        <h1>Medical Records</h1>
        <button className="btn-primary" onClick={() => openModal()}>
          Create New Record
        </button>
      </div>

      <div className="medical-records-list">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Diagnosis</th>
              <th>Treatment</th>
              <th>Follow-up Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicalRecords.map(record => (
              <tr key={record.id}>
                <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                <td>{record.patientName}</td>
                <td>{record.diagnosis}</td>
                <td>{record.treatment}</td>
                <td>
                  {record.followUpDate
                    ? new Date(record.followUpDate).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => openModal(record)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedRecord ? 'Edit Medical Record' : 'Create Medical Record'}</h2>
            <form onSubmit={selectedRecord ? handleUpdateRecord : handleCreateRecord}>
              <div className="form-group">
                <label>Patient</label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Diagnosis</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  required
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Treatment</label>
                <textarea
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  required
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Follow-up Date</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {selectedRecord ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords; 