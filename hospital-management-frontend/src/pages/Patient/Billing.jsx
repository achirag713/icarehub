import React, { useState, useEffect } from 'react';
import { patient } from '../../services/api';
import './Billing.css';

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await patient.getBills();
      setBills(response.data);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Failed to load bills. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async (id) => {
    if (window.confirm('Are you sure you want to pay this bill?')) {
      try {
        await patient.payBill(id);
        fetchBills();
      } catch (err) {
        console.error('Error paying bill:', err);
        setError('Failed to pay bill. Please try again.');
      }
    }
  };

  const openModal = (bill) => {
    setSelectedBill(bill);
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
        <h1>My Bills</h1>
      </div>

      <div className="bills-list">
        <table>
          <thead>
            <tr>
              <th>Date</th>
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
                    className="btn-view"
                    onClick={() => openModal(bill)}
                  >
                    View Details
                  </button>
                  {bill.status === 'Pending' && (
                    <button
                      className="btn-pay"
                      onClick={() => handlePayBill(bill.id)}
                    >
                      Pay Now
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedBill && (
        <div className="modal">
          <div className="modal-content">
            <h2>Bill Details</h2>
            <div className="bill-details">
              <div className="detail-group">
                <label>Date:</label>
                <span>{new Date(selectedBill.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="detail-group">
                <label>Amount:</label>
                <span>${selectedBill.amount}</span>
              </div>
              <div className="detail-group">
                <label>Description:</label>
                <p>{selectedBill.description}</p>
              </div>
              <div className="detail-group">
                <label>Due Date:</label>
                <span>{new Date(selectedBill.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-group">
                <label>Status:</label>
                <span className={`status-badge ${selectedBill.status.toLowerCase()}`}>
                  {selectedBill.status}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              {selectedBill.status === 'Pending' && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    handlePayBill(selectedBill.id);
                    setShowModal(false);
                  }}
                >
                  Pay Now
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedBill(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing; 