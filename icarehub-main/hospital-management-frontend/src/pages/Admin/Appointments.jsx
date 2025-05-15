import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { admin } from '../../services/api';
import './Appointments.css';

const Appointments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    purpose: '',
    status: 'Scheduled'
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await admin.getAllAppointments();
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  

  

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await admin.deleteAppointment(id);
        fetchAppointments();
      } catch (err) {
        console.error('Error deleting appointment:', err);
        setError('Failed to delete appointment. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      date: '',
      time: '',
      purpose: '',
      status: 'Scheduled'
    });
    setSelectedAppointment(null);
  };

  const openModal = (appointment = null) => {
    if (appointment) {
      setSelectedAppointment(appointment);
      setFormData({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: appointment.date.split('T')[0],
        time: appointment.date.split('T')[1].substring(0, 5),
        purpose: appointment.purpose,
        status: appointment.status
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading appointments...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="appointments-container">
        <div className="page-header">
          <h1>Appointments</h1>
          
        </div>

        <div className="appointments-list">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appointment => (
                <tr key={appointment.id}>
                  <td>{new Date(appointment.date).toLocaleDateString()}</td>
                  <td>{new Date(appointment.date).toLocaleTimeString()}</td>
                  <td>{appointment.patientName}</td>
                  <td>{appointment.doctorName}</td>
                  <td>{appointment.purpose}</td>
                  <td>
                    <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => openModal(appointment)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                    >
                      Delete
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
              <h2>{selectedAppointment ? 'Edit Appointment' : 'Create Appointment'}</h2>
              <form onSubmit={selectedAppointment ? handleUpdateAppointment : handleCreateAppointment}>
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
                  <label>Doctor</label>
                  <input
                    type="text"
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Purpose</label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">
                    {selectedAppointment ? 'Update' : 'Create'}
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
    </AdminLayout>
  );
};

export default Appointments;