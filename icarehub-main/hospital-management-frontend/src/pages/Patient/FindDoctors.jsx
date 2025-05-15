import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import { patient } from '../../services/api';
import './FindDoctors.css';
import { FaSearch } from 'react-icons/fa';

const departments = [
  'Cardiology',
  'Neurology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Ophthalmology',
  'Gynecology',
  'Urology',
  'Dentistry',
  'Psychology'
];

const FindDoctors = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patient.getAllDoctors();
      console.log('Doctors data:', response.data);
      setDoctors(response.data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBookAppointment = (doctorId) => {
    navigate(`/patient/book-appointments?doctorId=${doctorId}`);
  };

  const filteredDoctors = doctors.filter(doctor =>
    (selectedDepartment ? doctor.specialization === selectedDepartment : true) &&
    ((doctor.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (doctor.specialization?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
  );

  return (
    <PatientLayout>
      <div className="find-doctors-page">
        <div className="page-header">
          <h1>Find Doctors</h1>
          <p>Search and book appointments with our experienced doctors</p>
        </div>

        <div className="search-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search doctors by name or specialization..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <button className="search-button">
              <FaSearch />
            </button>
          </div>

          <div className="filters">
            <div className="filter-group">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={handleDepartmentChange}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <p>Loading doctors...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="no-results">
            <p>No doctors found matching your search criteria</p>
          </div>
        ) : (
          <div className="doctors-list">
            {filteredDoctors.map(doctor => (
              <div key={doctor.id} className="doctor-card">
                <div className="doctor-card-header">
                  <div className="doctor-image">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.username || 'Doctor')}&background=0D8ABC&color=fff&size=200`} alt={doctor.username} />
                  </div>
                  <div className="doctor-info">
                    <h2>{doctor.username || 'Doctor'}</h2>
                    <div className="doctor-specialization">Dept: {doctor.specialization || 'Specialist'}</div>
                    
                  </div>
                </div>
                <div className="doctor-card-body">
                  <div className="doctor-phonenumber">
                  <p><strong>Email:</strong> {doctor.email}</p>
                    <p><strong>Phone Number:</strong> {doctor.phoneNumber}</p>
                    
                  </div>
                </div>
                <div className="doctor-card-footer">
                  <button
                    className="btn-view-profile"
                    onClick={() => handleBookAppointment(doctor.id)}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
};

export default FindDoctors;