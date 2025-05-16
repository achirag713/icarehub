import React, { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { formatDate, formatCurrency } from '../../utils/dateUtils';
import { patient } from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Billings.css'; // Import the CSS file for styling

// Fallback doctor map in case API calls fail


const Billings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [patientName, setPatientName] = useState('Patient');

  useEffect(() => {
    fetchBills();
    fetchPatientProfile();
  }, []);

  const fetchPatientProfile = async () => {
    try {
      const profileResponse = await patient.getProfile();
      console.log('Patient profile response:', profileResponse.data);
      
      if (profileResponse.data && profileResponse.data.name) {
        setPatientName(profileResponse.data.name);
      }
    } catch (err) {
      console.error('Error fetching patient profile:', err);
      // Keep default patient name
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First fetch all bills
      const billsResponse = await patient.getBills();
      console.log('Raw Bills Data JSON:', JSON.stringify(billsResponse.data, null, 2));
      
      if (billsResponse.data.length > 0) {
        const firstBill = billsResponse.data[0];
        console.log('First bill properties:', Object.keys(firstBill));
        console.log('First bill JSON structure:', JSON.stringify(firstBill, null, 2));
      }
      
      // Function to directly get doctorId from bill object
      const getDoctorIdFromBill = (bill) => {
        // Log all properties to help identify the doctor ID field
        console.log('Bill properties:', Object.keys(bill));
        
        // Try various possible property names based on C# serialization
        if ('doctorId' in bill) return bill.doctorId;
        if ('DoctorId' in bill) return bill.DoctorId;
        
        // Special serialization cases
        for (const key of Object.keys(bill)) {
          if (key.toLowerCase() === 'doctorid') return bill[key];
        }
        
        // Check for nested objects
        for (const key of Object.keys(bill)) {
          if (typeof bill[key] === 'object' && bill[key] !== null) {
            console.log(`Checking nested object '${key}':`, bill[key]);
          }
        }
        
        return null;
      };

      // Enhance bills with doctor info, fetching one by one if needed
      const enhancedBills = await Promise.all(billsResponse.data.map(async (bill) => {
        try {
          // Get doctor ID - this needs to match the actual property in the JSON response
          const doctorId = getDoctorIdFromBill(bill);
          console.log(`Bill ${bill.id} doctor ID:`, doctorId);
          
          if (doctorId) {
            try {
              // Directly fetch doctor by ID
              const doctorResponse = await patient.getDoctor(doctorId);
              console.log(`Doctor response for ID ${doctorId}:`, doctorResponse);
              const doctorData = doctorResponse.data;
              console.log(`Fetched doctor data for bill ${bill.id}:`, doctorData);
              
              return {
                ...bill,
                doctorId: doctorId,
                doctorName: doctorData.username || "Specialist",
                doctorSpecialization: doctorData.specialization || ""
              };
            } catch (err) {
              console.error(`Error fetching doctor with ID ${doctorId}:`, err);
              // If doctor fetch fails, return bill with default doctor name
              return {
                ...bill,
                doctorId: doctorId,
                doctorName: "Specialist" 
              };
            }
          }
          
          // If no doctor ID, check if there's a doctor object directly
          if (bill.doctor && bill.doctor.username) {
            return {
              ...bill,
              doctorName: bill.doctor.username || "Specialist",
              doctorSpecialization: bill.doctor.specialization || ""
            };
          }
          
          // Default fallback
          return bill;
        } catch (err) {
          console.error(`Error processing bill ${bill.id}:`, err);
          return bill;
        }
      }));
      
      console.log('Enhanced bills with doctor info:', enhancedBills);
      setBills(enhancedBills);
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

  const generateReceipt = (bill) => {
    const doc = new jsPDF();
    
    // Add receipt header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Primary color
    doc.text('ICareHub Hospital', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Receipt', 105, 30, { align: 'center' });
    
    // Receipt information
    doc.setFontSize(12);
    doc.text(`Receipt #: ${bill.receiptNumber || `RCP-${bill.id}`}`, 20, 45);
    doc.text(`Date: ${formatDate(bill.billDate || bill.date)}`, 20, 55);
    doc.text(`Patient Name: ${patientName}`, 20, 65);
    
    
    // Payment details
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Payment Details', 20, 95);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Amount Paid: Rs. ${bill.amount}`, 20, 110);
    doc.text(`Payment Status: Paid`, 20, 120);
    doc.text(`Payment Date: ${formatDate(bill.paymentDate || bill.billDate || bill.date)}`, 20, 130);
    
    // Service details
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Service Details', 20, 150);
    
    // Create table for services
    const tableColumn = ["Service", "Amount"];
    const tableRows = [];
    
    // Add service items (use bill items if available, otherwise use the description)
    if (bill.items && bill.items.length > 0) {
      bill.items.forEach(item => {
        tableRows.push([item.description || "Medical Service", `Rs. ${item.amount}`]);
      });
    } else {
      tableRows.push([bill.description || bill.service || "Medical Service", `Rs. ${bill.amount}`]);
    }
    
    // Use the autoTable plugin
    autoTable(doc, {
      startY: 160,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Add footer
    const finalY = doc.lastAutoTable.finalY || 200;
    doc.setFontSize(10);
    doc.text('Thank you for choosing ICareHub Hospital', 105, finalY + 20, { align: 'center' });
    doc.text('This is a computer-generated receipt and does not require a signature', 105, finalY + 30, { align: 'center' });
    
    // Save the PDF
    doc.save(`Receipt-${bill.id}.pdf`);
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
        <div className="billings-page">
          <div className="loading">Loading bills...</div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="billings-page">
        <h1>Bills & Payments</h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="billings-grid">
          {bills.length === 0 ? (
            <div className="no-bills">
              <p>No bills found.</p>
            </div>
          ) : (
            bills.map(bill => (
              <div key={bill.id} className="billing-card">
                <div className="billing-header">
                  <div className="billing-id">Bill Id #{bill.receiptNumber}</div>
                  <div className="billing-date">{formatDate(bill.billDate || bill.date)}</div>
                </div>
                <div className="billing-details">
                  <div className="billing-item">
                    <div className="billing-label">Description:</div>
                    <div className="billing-value">
                      {bill.description}
                    </div>
                  </div>
                  <div className="billing-item">
                    <div className="billing-label">Amount:</div>
                    <div className="billing-amount">Rs. {(bill.amount)}</div>
                  </div>
                  <div className="billing-status status-paid">Paid</div>
                </div>
                <div className="billing-actions">
                  <button
                    className="btn-primary"
                    onClick={() => generateReceipt(bill)}
                  >
                    Download Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showDetails && selectedBill && (
          <div className="bill-details-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Bill Details #{selectedBill.receiptNumber}</h2>
                <button className="close-btn" onClick={handleCloseDetails}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Date:</span>
                      <span className="value">{formatDate(selectedBill.billDate || selectedBill.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Receipt Number:</span>
                      <span className="value">{selectedBill.receiptNumber || `RCP-${selectedBill.id}`}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="label">Status:</span>
                      <span className="value status-paid">Paid</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Amount:</span>
                      <span className="value">Rs.{selectedBill.amount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Payment Date:</span>
                      <span className="value">{formatDate(selectedBill.paymentDate || selectedBill.billDate || selectedBill.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-primary"
                    onClick={() => generateReceipt(selectedBill)}
                  >
                    Download Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
};

export default Billings;