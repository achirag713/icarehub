import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import { patient } from '../../services/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import './Settings.css'; // Import the CSS file for styling

const Settings = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    
  });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [user]); // Add user as dependency

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Initialize profile with user data from JWT
      setProfile(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));

      // Fetch additional profile data
      const response = await patient.getProfile();
      const profileData = response.data;

      // Update profile with fetched data
      setProfile(prev => ({
        ...prev,
        ...profileData,
        name: profileData.name || prev.name,
        email: profileData.email || prev.email
      }));
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword(prev => ({
      ...prev,
      [name]: value
    }));
  };

  

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await patient.updateProfile(profile);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await patient.changePassword(password);
      setSuccess('Password changed successfully');
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await patient.deleteAccount();
      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <PatientLayout>
        <div className="settings">
          <div className="loading">Loading settings...</div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="settings">
        <div className="page-header">
          <h1>Settings</h1>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <div className="settings-sections">
          {/* Profile Information */}
          <section className="settings-section">
            <h2>Profile Information</h2>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profile.name || ''}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email || ''}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profile.phoneNumber || ''}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={profile.address || ''}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth ({profile.dateOfBirth.split('T')[0]})</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={profile.dateOfBirth || ''}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={profile.gender || ''}
                    onChange={handleProfileChange}
                  >
                    <option value="">{profile.gender}</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="bloodGroup">Blood Group</label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={profile.bloodGroup || ''}
                    onChange={handleProfileChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </section>

          

          {/* Password Change */}
          <section className="settings-section">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={password.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={password.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={password.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <Button type="submit" variant="primary">
                  Change Password
                </Button>
              </div>
            </form>
          </section>

          

          {/* Delete Account */}
          <section className="settings-section danger-zone">
            <h2>Delete Account</h2>
            <p>Once you delete your account, there is no going back. Please be certain.</p>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Account
            </Button>
          </section>
        </div>

        {/* Delete Account Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Account"
        >
          <div className="delete-account-modal">
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <p>Please type "DELETE" to confirm:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PatientLayout>
  );
};

export default Settings;