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
  const [appointmentBillStatus, setAppointmentBillStatus] = useState({});  ``
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    purpose: '',
    status: 0 // Using 0 for Scheduled/Pending status
  });
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billData, setBillData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    doctorId: '',
    description: '',
    appointmentId: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Check if bills exist for completed appointments
  const checkBillsExistence = async (completedAppointments) => {
    try {
      
      console.log('Bills from API:', bills.data);
      
      // Create a map of appointment IDs with bills
      const billStatuses = {};
      
      // Check each bill to see if it's associated with our appointments
      if (Array.isArray(bills.data)) {
        bills.data.forEach(bill => {
          if (bill.appointmentId) {
            billStatuses[bill.appointmentId] = true;
          }
        });
      }
      
      setAppointmentBillStatus(billStatuses);
    } catch (err) {
      console.error('Error fetching bills:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await admin.getAllAppointments();
      console.log('Appointment data from API:', response.data);
      
      // Check for past appointments that need status updates
      const currentDate = new Date();
      const updatedAppointments = await Promise.all(response.data.map(async (appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        
        // If appointment is in the past and still marked as Scheduled (0), update to Completed (1)
        if (appointmentDate < currentDate && appointment.status === 0) {
          console.log(`Updating past appointment ${appointment.id} to Completed status`);
          
          try {
            // Create update payload
            const updateData = {
              id: appointment.id,
              status: 1, // 1 = Completed
              appointmentDate: appointment.appointmentDate,
              reason: appointment.purpose || '',
              notes: appointment.notes || ''
            };
            
            // Update appointment in the database
            await admin.updateAppointment(appointment.id, updateData);
            
            // Return the updated appointment
            return {
              ...appointment,
              status: 1 // Update the status in our local array as well
            };
          } catch (updateErr) {
            console.error(`Error updating past appointment ${appointment.id}:`, updateErr);
            return appointment; // Return original if update fails
          }
        }
        
        return appointment; // Return original appointment if no update needed
      }));
      
      setAppointments(updatedAppointments);
      
      // Check which completed appointments already have bills
      const completedAppointments = updatedAppointments.filter(app => app.status === 1);
      
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const appointmentData = {
        ...formData,
        date: new Date(formData.date + 'T' + formData.time).toISOString(),
      };
      await admin.createAppointment(appointmentData);
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment. Please try again.');
    }
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    try {
      const appointmentData = {
        ...formData,
        date: new Date(formData.date + 'T' + formData.time).toISOString(),
      };
      await admin.updateAppointment(selectedAppointment.id, appointmentData);
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Failed to update appointment. Please try again.');
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

  const handleCancelAppointment = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        // Find the appointment
        const appointment = appointments.find(app => app.id === id);
        if (!appointment) return;
        
        // Create a payload with the expected field names
        const updateData = {
          id: appointment.id,
          status: 2, // 2 = Cancelled in the enum
          appointmentDate: appointment.appointmentDate,
          reason: appointment.purpose || '',
          notes: appointment.notes || ''
        };
        
        console.log('Cancelling appointment with data:', updateData);
        
        // Update the appointment status in the database
        await admin.updateAppointment(id, updateData);
        
        // Show success message
        alert('Appointment successfully cancelled');
        
        // Refresh the appointments list
        fetchAppointments();
      } catch (err) {
        console.error('Error cancelling appointment:', err);
        setError('Failed to cancel appointment. Please try again.');
        alert('Failed to cancel appointment. Please try again.');
      }
    }
  };

  const handleUploadBill = async (appointment) => {
    // Safety check - ensure we can only handle bills for completed appointments
    if (appointment.status !== 1) {
      alert('Bills can only be managed for completed appointments');
      return;
    }
    
    // Check if a bill already exists for this appointment
    if (appointmentBillStatus[appointment.id]) {
      try {
        // Get all bills
        const billsResponse = await admin.getBills();
        
        // Find the bill for this appointment
        const appointmentBill = billsResponse.data.find(bill => bill.appointmentId === appointment.id);
        
        if (appointmentBill) {
          // Display bill information in a formatted alert
          const formattedAmount = new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR' 
          }).format(appointmentBill.amount);
          
          const billInfo = `Bill Information:
Amount: ${formattedAmount}
Date: ${new Date(appointmentBill.date).toLocaleDateString()}
Status: ${appointmentBill.status}
Description: ${appointmentBill.description}`;
          
          alert(billInfo);
          return;
        } else {
          // If we can't find the bill, allow creating a new one
          console.log("Bill marked as existing but not found. Allowing new bill creation.");
        }
      } catch (error) {
        console.error("Error fetching bill details:", error);
      }
    }
    
    // Create a new bill
    setBillData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      doctorId: appointment.doctorId || '',
      description: `Bill for appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()}`,
      appointmentId: appointment.id
    });
    setIsBillModalOpen(true);
  };

  const handleBillSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBillForm()) {
      return;
    }
    
    try {
      const billPayload = {
        patientId: appointments.find(app => app.id === billData.appointmentId)?.patientId,
        ...billData
      };
      
      console.log('Submitting bill with data:', billPayload);
      
      // Add a bill for the patient
      const response = await admin.addBill(billPayload);
      
      console.log('Bill created successfully:', response.data);
      
      // Update the bill status for this appointment
      setAppointmentBillStatus(prev => ({
        ...prev,
        [billData.appointmentId]: true
      }));
      
      setIsBillModalOpen(false);
      
      // Show success message
      alert('Bill uploaded successfully!');
    } catch (error) {
      console.error('Error adding bill:', error);
      alert('Error uploading bill. Please try again.');
    }
  };

  const validateBillForm = () => {
    const errors = {};
    
    if (!billData.amount || billData.amount <= 0) {
      errors.amount = 'Valid amount is required';
      alert('Please enter a valid amount');
      return false;
    }
    
    if (!billData.date) {
      errors.date = 'Date is required';
      alert('Please enter a date');
      return false;
    }

    if (!billData.description || !billData.description.trim()) {
      errors.description = 'Description is required';
      alert('Please enter a description');
      return false;
    }
    
    return true;
  };

  const handleBillChange = (e) => {
    const { name, value } = e.target;
    setBillData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      date: '',
      time: '',
      purpose: '',
      status: 0 // Using 0 for Scheduled/Pending status
    });
    setSelectedAppointment(null);
  };

  const openModal = (appointment = null) => {
    if (appointment) {
      setSelectedAppointment(appointment);

      // Extract date and time from appointmentDate
      const appointmentDate = new Date(appointment.appointmentDate);
      const dateString = appointmentDate.toISOString().split('T')[0];
      const timeString = appointmentDate.toTimeString().slice(0, 5);

      setFormData({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: dateString,
        time: timeString,
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
                  <td>
                    {appointment.appointmentDate ? 
                      new Date(appointment.appointmentDate).toLocaleDateString() : 
                      'Not scheduled'}
                  </td>
                  <td>
                    {appointment.appointmentDate ? 
                      new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                      'Not specified'}
                  </td>
                  <td>{appointment.patientName || 'Unknown'}</td>
                  <td>{appointment.doctorName ? `Dr. ${appointment.doctorName}` : 'Not assigned'}</td>
                  <td>{appointment.purpose}</td>
                  <td>
                    {(() => {
                      let statusText = 'Pending';
                      let statusClass = 'scheduled';
                      
                      // Check if status is a number (enum value)
                      if (typeof appointment.status === 'number') {
                        switch(appointment.status) {
                          case 0: // Scheduled
                            statusText = 'Pending';
                            statusClass = 'scheduled';
                            break;
                          case 1: // Completed
                            statusText = 'Completed';
                            statusClass = 'completed';
                            break;
                          case 2: // Cancelled
                            statusText = 'Cancelled';
                            statusClass = 'cancelled';
                            break;
                          case 3: // NoShow
                            statusText = 'No Show';
                            statusClass = 'cancelled';
                            break;
                          default:
                            statusText = 'Pending';
                            statusClass = 'scheduled';
                        }
                      } else if (typeof appointment.status === 'string') {
                        // Support for string status (backward compatibility)
                        statusText = appointment.status;
                        statusClass = appointment.status.toLowerCase();
                      }
                      
                      return (
                        <span className={`status-badge ${statusClass}`}>
                          {statusText}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-cancel"
                        onClick={() => handleCancelAppointment(appointment.id)}
                        disabled={appointment.status === 1 || appointment.status === 2} // Disable if already completed or cancelled
                      >
                        Cancel
                      </button>
                      <button
                        className={`btn-bill ${appointmentBillStatus[appointment.id] ? 'btn-bill-view' : ''}`}
                        onClick={() => handleUploadBill(appointment)}
                        disabled={appointment.status !== 1} // Only enable for completed appointments
                      >
                        {appointmentBillStatus[appointment.id] ? 'View Bill' : 'Upload Bill'}
                      </button>
                    </div>
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
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value, 10) })}
                    required
                  >
                    <option value="0">Pending</option>
                    <option value="1">Completed</option>
                    <option value="2">Cancelled</option>
                    <option value="3">No Show</option>
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

        {isBillModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h2>Upload Bill</h2>
              <form onSubmit={handleBillSubmit}>
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={billData.amount}
                    onChange={handleBillChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={billData.date}
                    onChange={handleBillChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    name="description"
                    value={billData.description}
                    onChange={handleBillChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={billData.status}
                    onChange={handleBillChange}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">
                    Upload Bill
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsBillModalOpen(false)}
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