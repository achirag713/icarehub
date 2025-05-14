import React, { useState, useEffect } from 'react';
import { doctor } from '../../services/api';
import './Prescriptions.css';

const Prescriptions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    notes: ''
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await doctor.getPrescriptions();
      setPrescriptions(response.data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    try {
      await doctor.createPrescription(formData);
      setShowModal(false);
      fetchPrescriptions();
      resetForm();
    } catch (err) {
      console.error('Error creating prescription:', err);
      setError('Failed to create prescription. Please try again.');
    }
  };

  const handleUpdatePrescription = async (e) => {
    e.preventDefault();
    try {
      await doctor.updatePrescription(selectedPrescription.id, formData);
      setShowModal(false);
      fetchPrescriptions();
      resetForm();
    } catch (err) {
      console.error('Error updating prescription:', err);
      setError('Failed to update prescription. Please try again.');
    }
  };

  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { name: '', dosage: '', frequency: '', duration: '' }
      ]
    });
  };

  const handleRemoveMedication = (index) => {
    const updatedMedications = formData.medications.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = formData.medications.map((med, i) => {
      if (i === index) {
        return { ...med, [field]: value };
      }
      return med;
    });
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
      notes: ''
    });
    setSelectedPrescription(null);
  };

  const openModal = (prescription = null) => {
    if (prescription) {
      setSelectedPrescription(prescription);
      setFormData({
        patientId: prescription.patientId,
        medications: prescription.medications,
        notes: prescription.notes
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading prescriptions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="prescriptions-container">
      <div className="page-header">
        <h1>Prescriptions</h1>
        <button className="btn-primary" onClick={() => openModal()}>
          Create New Prescription
        </button>
      </div>

      <div className="prescriptions-list">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Medications</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map(prescription => (
              <tr key={prescription.id}>
                <td>{new Date(prescription.createdAt).toLocaleDateString()}</td>
                <td>{prescription.patientName}</td>
                <td>{prescription.medications.length} medication(s)</td>
                <td>{prescription.notes}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => openModal(prescription)}
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
            <h2>{selectedPrescription ? 'Edit Prescription' : 'Create Prescription'}</h2>
            <form onSubmit={selectedPrescription ? handleUpdatePrescription : handleCreatePrescription}>
              <div className="form-group">
                <label>Patient</label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                />
              </div>

              <div className="medications-section">
                <label>Medications</label>
                {formData.medications.map((medication, index) => (
                  <div key={index} className="medication-form">
                    <div className="medication-header">
                      <h4>Medication {index + 1}</h4>
                      {index > 0 && (
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveMedication(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="medication-fields">
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          value={medication.name}
                          onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Dosage</label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Frequency</label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Duration</label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddMedication}
                >
                  Add Medication
                </button>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {selectedPrescription ? 'Update' : 'Create'}
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

export default Prescriptions; 