import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import { doctor } from '../../services/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Profile form state with default empty values
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualifications: '',
    experience: '',
    bio: ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // States for UI
  const [activeTab, setActiveTab] = useState('profile');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch doctor profile data
        const response = await doctor.getProfile();
        const profileData = response.data;

        // Initialize form with safe fallbacks
        setProfileForm({
          name: profileData?.name || user?.name || '',
          email: profileData?.email || user?.email || '',
          phone: profileData?.phone || '',
          specialization: profileData?.specialization || '',
          qualifications: profileData?.qualifications || '',
          experience: profileData?.experience || '',
          bio: profileData?.bio || ''
        });
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);
  
  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errorMessage) {
      setErrorMessage('');
    }
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      await doctor.updateProfile(profileForm);
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage('Failed to update profile. Please try again.');
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setErrorMessage('New passwords do not match');
        return;
      }

      await doctor.changePassword(passwordForm);
      setSuccessMessage('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error changing password:', err);
      setErrorMessage('Failed to change password. Please try again.');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setErrorMessage('Please type DELETE to confirm');
      return;
    }
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      await doctor.deleteAccount();
      login(null);
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setErrorMessage('Failed to delete account. Please try again.');
    }
  };

  // Early return if no user
  if (!user) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <DoctorLayout>
        <div className="settings-page">
          <div className="loading">Loading settings...</div>
        </div>
      </DoctorLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DoctorLayout>
        <div className="settings-page">
          <div className="error-message">{error}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <ErrorBoundary>
      <DoctorLayout>
        <div className="settings-page">
          <h1>Settings</h1>
          
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
          
          <div className="settings-container">
            <div className="settings-tabs">
              <button
                className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <button
                className={`tab ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                Password
              </button>
              <button
                className={`tab ${activeTab === 'danger' ? 'active' : ''}`}
                onClick={() => setActiveTab('danger')}
              >
                Danger Zone
              </button>
            </div>
            
            <div className="settings-content">
              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <div className="settings-panel">
                  <h2>Profile Information</h2>
                  <p className="panel-description">Update your personal information and professional details</p>
                  
                  <form onSubmit={handleProfileSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="specialization">Specialization</label>
                        <input
                          type="text"
                          id="specialization"
                          name="specialization"
                          value={profileForm.specialization}
                          onChange={handleProfileChange}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="qualifications">Qualifications</label>
                        <input
                          type="text"
                          id="qualifications"
                          name="qualifications"
                          value={profileForm.qualifications}
                          onChange={handleProfileChange}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="experience">Years of Experience</label>
                        <input
                          type="number"
                          id="experience"
                          name="experience"
                          value={profileForm.experience}
                          onChange={handleProfileChange}
                          min="0"
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label htmlFor="bio">Bio</label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={profileForm.bio}
                          onChange={handleProfileChange}
                          rows="4"
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <Button type="submit" variant="primary">Save Changes</Button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Password Tab */}
              {activeTab === 'password' && (
                <div className="settings-panel">
                  <h2>Change Password</h2>
                  <p className="panel-description">Update your account password</p>
                  
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
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
                        value={passwordForm.newPassword}
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
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    
                    <div className="form-actions">
                      <Button type="submit" variant="primary">Update Password</Button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div className="settings-panel danger-zone">
                  <h2>Danger Zone</h2>
                  <p className="panel-description">Actions here can permanently affect your account</p>
                  
                  <div className="danger-item">
                    <div className="danger-info">
                      <h3>Delete Account</h3>
                      <p>Permanently delete your account and all associated data</p>
                    </div>
                    <Button 
                      variant="danger" 
                      onClick={() => setIsDeleteModalOpen(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Delete Account Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Account"
        >
          <div className="delete-account-modal">
            <p>
              This action cannot be undone. This will permanently delete your account and remove all
              associated data.
            </p>
            <p className="warning-text">
              Please type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="delete-confirm-input"
            />
            {errorMessage && (
              <div className="error-message">{errorMessage}</div>
            )}
            <div className="modal-actions">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                Permanently Delete Account
              </Button>
            </div>
          </div>
        </Modal>
      </DoctorLayout>
    </ErrorBoundary>
  );
};

export default Settings;