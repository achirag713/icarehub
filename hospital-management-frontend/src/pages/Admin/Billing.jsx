import React, { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import './Billing.css';

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    amount: '',
    description: '',
    dueDate: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await admin.getAllBills();
      setBills(response.data);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Failed to load bills. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      await admin.createBill(formData);
      setShowModal(false);
      fetchBills();
      resetForm();
    } catch (err) {
      console.error('Error creating bill:', err);
      setError('Failed to create bill. Please try again.');
    }
  };

  const handleUpdateBill = async (e) => {
    e.preventDefault();
    try {
      await admin.updateBill(selectedBill.id, formData);
      setShowModal(false);
      fetchBills();
      resetForm();
    } catch (err) {
      console.error('Error updating bill:', err);
      setError('Failed to update bill. Please try again.');
    }
  };

  const handleDeleteBill = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await admin.deleteBill(id);
        fetchBills();
      } catch (err) {
        console.error('Error deleting bill:', err);
        setError('Failed to delete bill. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      amount: '',
      description: '',
      dueDate: '',
      status: 'Pending'
    });
    setSelectedBill(null);
  };

  const openModal = (bill = null) => {
    if (bill) {
      setSelectedBill(bill);
      setFormData({
        patientId: bill.patientId,
        amount: bill.amount,
        description: bill.description,
        dueDate: bill.dueDate.split('T')[0],
        status: bill.status
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading bills...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="billing-container">
      <div className="page-header">
        <h1>Billing</h1>
        <button className="btn-primary" onClick={() => openModal()}>
          Create New Bill
        </button>
      </div>

      <div className="bills-list">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.id}>
                <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                <td>{bill.patientName}</td>
                <td>${bill.amount}</td>
                <td>{bill.description}</td>
                <td>{new Date(bill.dueDate).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${bill.status.toLowerCase()}`}>
                    {bill.status}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => openModal(bill)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteBill(bill.id)}
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
            <h2>{selectedBill ? 'Edit Bill' : 'Create Bill'}</h2>
            <form onSubmit={selectedBill ? handleUpdateBill : handleCreateBill}>
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
                <label>Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {selectedBill ? 'Update' : 'Create'}
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

export default Billing; 