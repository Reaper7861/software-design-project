import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { refreshProfileStatus } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    skills: [],
    preferences: '',
    availability: [],
  });

  // State to store original data (used for Cancel button)
  const [initialFormData, setInitialFormData] = useState(null);

  // UI state
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);

  const dropdownRef = useRef();

  // Skill options list
  const skillOptions = [
    'Communication', 'Teamwork', 'Leadership', 'Event Planning',
    'Fundraising', 'Public Speaking', 'Teaching/Tutoring',
    'Childcare', 'Elderly Support', 'Community Outreach'
  ];

  // Fetch profile data on component mount
  useEffect(() => {
    let unsubscribe;
    let didCancel = false;
    setLoading(true);
    setError('');

    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (didCancel) return;
      if (!user) {
        setError('User not logged in');
        setLoading(false);
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const response = await axios.get('http://localhost:8080/api/users/profile', {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        const profileData = response.data.profile; 
        // Convert availability object to array if needed
        const normalizedData = {
          ...profileData,
          availability: Array.isArray(profileData.availability)
            ? profileData.availability
            : Object.values(profileData.availability || {})
        };
        setFormData(normalizedData);
        setInitialFormData(normalizedData);
        setError('');
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (err.response && err.response.status === 404) {
          // Redirect to register if profile not found
            navigate('/phantompage');
            } else {
        setError('Failed to load profile.');
        }

        } finally {
        setLoading(false);
      }
    });
    return () => {
      didCancel = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle clicking outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSkillDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input changes only when editable
  const handleChange = (e) => {
    if (!isEditable) return; // Do nothing if not editing
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Toggle dropdown for skills
  const toggleSkillDropdown = () => {
    if (!isEditable) return;
    setSkillDropdownOpen(prev => !prev);
  };

  // Toggle skill selection
  const toggleSkill = (skill, checked) => {
    if (!isEditable) return;

    setFormData(prev => ({
      ...prev,
      skills: checked
        ? [...(Array.isArray(prev.skills) ? prev.skills : []), skill]
        : (Array.isArray(prev.skills) ? prev.skills.filter(s => s !== skill) : [])
    }));
  };

  // Remove individual skill
  const removeSkill = (skill) => {
    if (!isEditable) return;

    setFormData(prev => ({
      ...prev,
      skills: Array.isArray(prev.skills) ? prev.skills.filter(s => s !== skill) : []
    }));
  };

  // Add availability date
  const addDate = (date) => {
    if (!isEditable || !date || formData.availability.includes(date)) return;

    setFormData(prev => ({
      ...prev,
      availability: [...prev.availability, date]
    }));
  };

  // Remove availability date
  const removeDate = (date) => {
    if (!isEditable) return;

    setFormData(prev => ({
      ...prev,
      availability: prev.availability.filter(d => d !== date)
    }));
  };

  // Form validation logic unchanged...
  const validate = () => {
    if (!formData.fullName || typeof formData.fullName !== 'string' || !formData.fullName.trim()) return 'Full Name is required.';
    if (typeof formData.fullName !== 'string' || formData.fullName.length > 50) return 'Full Name cannot exceed 50 characters.';
    if (!formData.address1 || typeof formData.address1 !== 'string' || !formData.address1.trim()) return 'Address is required.';
    if (typeof formData.address1 !== 'string' || formData.address1.length > 100) return 'Address cannot exceed 100 characters.';
    if (formData.address2 && typeof formData.address2 === 'string' && formData.address2.length > 100) return 'Address 2 cannot exceed 100 characters.';
    if (!formData.city || typeof formData.city !== 'string' || !formData.city.trim()) return 'City is required.';
    if (typeof formData.city !== 'string' || formData.city.length > 100) return 'City cannot exceed 100 characters.';
    if (!formData.state) return 'Please select your state.';
    if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) return 'Zip Code must be in 12345 or 12345-6789 format.';
    if (!Array.isArray(formData.skills) || formData.skills.length === 0) return 'Please select at least one skill.';
    if (!Array.isArray(formData.availability) || formData.availability.length === 0) return 'Please select at least one availability date.';
    return '';
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!isEditable) return;
  
    setLoading(true);
    setError('');
  
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
  
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not logged in');
        setLoading(false);
        return;
      }
  
      const idToken = await user.getIdToken();
  
      const res = await fetch('http://localhost:8080/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }
  
      const updatedProfile = await res.json();
      setInitialFormData(updatedProfile);
      setIsEditable(false);
      setLoading(false);
      
      // Refresh profile status to update the Navbar immediately
      await refreshProfileStatus();
      
      navigate('/events');
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.message || 'Update failed. Please try again.');
      setLoading(false);
    }
  };

  // Cancel edits and revert to original data
  const handleCancel = () => {
    setFormData(initialFormData);
    setIsEditable(false);
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Profile</h2>
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Full name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              style={styles.input}
              disabled={!isEditable} // Disabled unless editing
            />
          </div>

          {/* Address 1 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Address 1</label>
            <input
              type="text"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              style={styles.input}
              disabled={!isEditable}
            />
          </div>

          {/* Address 2 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Address 2</label>
            <input
              type="text"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              style={styles.input}
              disabled={!isEditable}
            />
          </div>

          {/* City */}
          <div style={styles.formGroup}>
            <label style={styles.label}>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              style={styles.input}
              disabled={!isEditable}
            />
          </div>

          {/* State */}
          <div style={styles.formGroup}>
            <label style={styles.label}>State</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              style={styles.input}
              disabled={!isEditable}
            >
              <option value="">Select a state</option>
              {[
                'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI',
                'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI',
                'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC',
                'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
                'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
              ].map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Zip */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Zip Code</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              style={styles.input}
              disabled={!isEditable}
            />
          </div>

          {/* Skills Multi-select */}
          <div style={styles.formGroup} ref={dropdownRef}>
            <label style={styles.label}>Skills</label>
            {/* Display selected skills as badges */}
            <div
              onClick={toggleSkillDropdown}
              style={{
                ...styles.input,
                cursor: isEditable ? 'pointer' : 'default',
                minHeight: '40px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px',
                alignItems: 'center',
                backgroundColor: isEditable ? 'white' : '#f9f9f9'
              }}
            >
              {(!Array.isArray(formData.skills) || formData.skills.length === 0) && <span style={{ color: '#999' }}>Select skills...</span>}

              {Array.isArray(formData.skills) && formData.skills.map(skill => (
                <span key={skill} style={styles.skillBadge}>
                  {skill}
                  {isEditable && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        removeSkill(skill);
                      }}
                      style={styles.removeSkillBtn}
                      aria-label={`Remove skill ${skill}`}
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>

            {/* Dropdown with skill options */}
            {skillDropdownOpen && isEditable && (
              <div style={styles.dropdown}>
                {skillOptions.map(skill => (
                  <label key={skill} style={styles.dropdownItem}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(formData.skills) && formData.skills.includes(skill)}
                      onChange={e => toggleSkill(skill, e.target.checked)}
                    />
                    {' '}{skill}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Preferences Textarea */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Preferences</label>
            <textarea
              name="preferences"
              value={formData.preferences}
              onChange={handleChange}
              style={styles.textarea}
              disabled={!isEditable}
            />
          </div>

          {/* Availability Dates */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Availability</label>
            {/* Date picker for adding availability */}
            {isEditable && (
              <input
                type="date"
                onChange={e => {
                  addDate(e.target.value);
                  e.target.value = ''; // clear after add
                }}
                style={{ marginBottom: '10px' }}
              />
            )}

            {/* Display selected dates as badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {Array.isArray(formData.availability) && formData.availability.map(date => (
                <span key={date} style={styles.dateBadge}>
                  {new Date(date).toLocaleDateString()}
                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => removeDate(date)}
                      style={styles.removeSkillBtn}
                      aria-label={`Remove date ${date}`}
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ marginTop: '20px' }}>
            {!isEditable ? (
              // Show Edit button when NOT editing
              <button
                type="button"
                onClick={(e) => {
                    e.preventDefault(); 
                    console.log('Edit button clicked');
                    setIsEditable(true);
                }}
                style={styles.primaryBtn}
                >
                Edit Profile
              </button>
            ) : (
              // Show Save & Cancel when editing
              <>
                <button type="submit" disabled={loading} style={styles.primaryBtn}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// Styles (unchanged)
const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '20px' },
  card: {
    maxWidth: 600, width: '100%', backgroundColor: 'white',
    borderRadius: 8, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  title: { fontWeight: 'bold', fontSize: 24, marginBottom: 20 },
  formGroup: { marginBottom: 15 },
  label: { display: 'block', marginBottom: 5, fontWeight: 'bold' },
  input: {
    width: '100%', padding: 8, borderRadius: 4,
    border: '1px solid #ccc', fontSize: 16,
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%', height: 80, padding: 8, borderRadius: 4,
    border: '1px solid #ccc', fontSize: 16,
    boxSizing: 'border-box'
  },
  skillBadge: {
    backgroundColor: '#e0e0e0', borderRadius: 15, padding: '5px 10px',
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: 14,
  },
  removeSkillBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, lineHeight: 1, padding: 0, color: 'red'
  },
  dropdown: {
    position: 'absolute', backgroundColor: 'white',
    border: '1px solid #ccc', borderRadius: 4,
    maxHeight: 150, overflowY: 'auto',
    marginTop: 5, zIndex: 10,
    width: '100%',
    boxSizing: 'border-box',
  },
  dropdownItem: {
    display: 'block', padding: '5px 10px', cursor: 'pointer',
    userSelect: 'none',
  },
  dateBadge: {
    backgroundColor: '#cce5ff', borderRadius: 15, padding: '5px 10px',
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: '#007bff', color: 'white', padding: '10px 15px',
    border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 10
  },
  cancelBtn: {
    backgroundColor: '#6c757d', color: 'white', padding: '10px 15px',
    border: 'none', borderRadius: 4, cursor: 'pointer'
  },
  error: {
    marginBottom: 15,
    color: 'red',
    fontWeight: 'bold'
  }
};

export default ProfilePage;
