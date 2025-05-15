import React, { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { formatDate, formatCurrency } from '../../utils/dateUtils';
import { patient } from '../../services/api';
import './Billings.css'; // Import the CSS file for styling

const Billings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bills, setBills] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'pending', 'overdue'
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patient.getBills();
      setBills(response.data);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Failed to load bills. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (bill) => {
    setSelectedBill(bill);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedBill(null);
  };

  const handlePayBill = async (billId) => {
    if (window.confirm('Are you sure you want to proceed with the payment?')) {
      try {
        setLoading(true);
        setError(null);
        await patient.payBill(billId);
        await fetchBills(); // Refresh the list
        setShowDetails(false);
      } catch (err) {
        console.error('Error processing payment:', err);
        setError('Failed to process payment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getFilteredBills = () => {
    if (filter === 'all') {
      return bills;
    }
    return bills.filter(bill => bill.status.toLowerCase() === filter.toLowerCase());
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'overdue':
        return 'status-overdue';
      default:
        return '';
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.amount * item.quantity), 0);
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="billings">
          <div className="loading">Loading bills...</div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="billings">
        <div className="page-header">
          <h1>Bills & Payments</h1>
          <div className="filter-controls">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Bills
            </button>
            <button
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={filter === 'paid' ? 'active' : ''}
              onClick={() => setFilter('paid')}
            >
              Paid
            </button>
            <button
              className={filter === 'overdue' ? 'active' : ''}
              onClick={() => setFilter('overdue')}
            >
              Overdue
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="bills-list">
          {getFilteredBills().length === 0 ? (
            <div className="no-bills">
              <p>No bills found.</p>
            </div>
          ) : (
            getFilteredBills().map(bill => (
              <div key={bill.id} className="bill-card">
                <div className="bill-header">
                  <h3>Bill #{bill.id}</h3>
                  <span className={`status-badge ${getStatusClass(bill.status)}`}>
                    {bill.status}
                  </span>
                </div>
                <div className="bill-details">
                  <div className="detail-item">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(bill.date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Due Date:</span>
                    <span className="value">{formatDate(bill.dueDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Amount:</span>
                    <span className="value">{formatCurrency(bill.totalAmount)}</span>
                  </div>
                </div>
                <div className="bill-summary">
                  <p>{bill.description}</p>
                </div>
                <div className="bill-actions">
                  <button
                    className="view-details-btn"
                    onClick={() => handleViewDetails(bill)}
                  >
                    View Details
                  </button>
                  {bill.status.toLowerCase() === 'pending' && (
                    <button
                      className="pay-now-btn"
                      onClick={() => handlePayBill(bill.id)}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {showDetails && selectedBill && (
          <div className="bill-details-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Bill Details #{selectedBill.id}</h2>
                <button className="close-btn" onClick={handleCloseDetails}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Date:</span>
                      <span className="value">{formatDate(selectedBill.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Due Date:</span>
                      <span className="value">{formatDate(selectedBill.dueDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Status:</span>
                      <span className={`value ${getStatusClass(selectedBill.status)}`}>
                        {selectedBill.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Description:</span>
                      <span className="value">{selectedBill.description}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Bill Items</h3>
                  <div className="bill-items-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Description</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{formatCurrency(item.amount * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4" className="total-label">Total Amount:</td>
                          <td className="total-amount">
                            {formatCurrency(calculateTotal(selectedBill.items))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {selectedBill.payment && (
                  <div className="detail-section">
                    <h3>Payment Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Payment Date:</span>
                        <span className="value">{formatDate(selectedBill.payment.date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Payment Method:</span>
                        <span className="value">{selectedBill.payment.method}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Transaction ID:</span>
                        <span className="value">{selectedBill.payment.transactionId}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBill.status.toLowerCase() === 'pending' && (
                  <div className="modal-actions">
                    <button
                      className="pay-now-btn"
                      onClick={() => handlePayBill(selectedBill.id)}
                    >
                      Pay Now
                    </button>
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

export default Billings;