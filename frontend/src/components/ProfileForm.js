import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';

const ProfileForm = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState(initialData || {
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const skillOptions = [
    'Communication', 'Teamwork', 'Leadership', 'Event Planning',
    'Fundraising', 'Public Speaking', 'Teaching/Tutoring',
    'Childcare', 'Elderly Support', 'Community Outreach'
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSkillDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSkillDropdown = () => setSkillDropdownOpen(prev => !prev);

  const toggleSkill = (skill, checked) => {
    setFormData(prev => {
      const newSkills = checked ? [...prev.skills, skill] : prev.skills.filter(s => s !== skill);
      return { ...prev, skills: newSkills };
    });
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addDate = (date) => {
    if (date && !formData.availability.includes(date)) {
      setFormData(prev => ({
        ...prev,
        availability: [...prev.availability, date]
      }));
    }
  };

  const removeDate = (date) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.filter(d => d !== date)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      setLoading(false);
      return;
    }
    if (formData.fullName.length > 50) {
      setError('Full Name cannot exceed 50 characters.');
      setLoading(false);
      return;
    }
    if (!formData.address1.trim()) {
      setError('Address is required.');
      setLoading(false);
      return;
    }
    if (formData.address1.length > 100) {
      setError('Address cannot exceed 100 characters.');
      setLoading(false);
      return;
    }
    if (formData.address2 && formData.address2.length > 100) {
      setError('Address 2 cannot exceed 100 characters.');
      setLoading(false);
      return;
    }
    if (!formData.city.trim()) {
      setError('City is required.');
      setLoading(false);
      return;
    }
    if (formData.city.length > 100) {
      setError('City cannot exceed 100 characters.');
      setLoading(false);
      return;
    }
    if (!formData.state) {
      setError('Please select your state.');
      setLoading(false);
      return;
    }
    if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      setError('Zip Code must be 5 digits or 5+4 format (e.g., 12345 or 12345-6789)');
      setLoading(false);
      return;
    }
    if (formData.skills.length === 0) {
      setError('Please select at least one skill.');
      setLoading(false);
      return;
    }
    if (formData.availability.length === 0) {
      setError('Please select at least one availability date.');
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');
      const idToken = await user.getIdToken();
      const res = await fetch('http://localhost:8080/api/users/create-profile', {
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
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.formGroup}>
        <label style={styles.label}>Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          style={styles.input}
          maxLength={50}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Address 1</label>
        <input
          type="text"
          name="address1"
          value={formData.address1}
          onChange={handleChange}
          style={styles.input}
          maxLength={100}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Address 2</label>
        <input
          type="text"
          name="address2"
          value={formData.address2}
          onChange={handleChange}
          style={styles.input}
          maxLength={100}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>City</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          style={styles.input}
          maxLength={100}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>State</label>
        <select
          name="state"
          value={formData.state}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Select a state</option>
          {['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'].map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Zip Code</label>
        <input
          type="text"
          name="zipCode"
          value={formData.zipCode}
          onChange={handleChange}
          style={styles.input}
          maxLength={10}
        />
      </div>
      <div style={styles.formGroup} ref={dropdownRef}>
        <label style={styles.label}>Skills</label>
        <div
          onClick={toggleSkillDropdown}
          style={{ ...styles.input, cursor: 'pointer' }}
        >
          {formData.skills.length === 0 ? 'Select skills...' : formData.skills.join(', ')}
        </div>
        {skillDropdownOpen && (
          <div style={styles.dropdown}>
            {skillOptions.map(skill => (
              <label key={skill} style={styles.dropdownItem}>
                <input
                  type="checkbox"
                  checked={formData.skills.includes(skill)}
                  onChange={(e) => toggleSkill(skill, e.target.checked)}
                />
                {' '}{skill}
              </label>
            ))}
          </div>
        )}
        <div style={styles.tags}>
          {formData.skills.map(skill => (
            <span key={skill} style={styles.tag}>
              {skill}
              <button onClick={() => removeSkill(skill)} style={styles.removeBtn}>×</button>
            </span>
          ))}
        </div>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Preferences</label>
        <textarea
          name="preferences"
          value={formData.preferences}
          onChange={handleChange}
          style={{ ...styles.input, height: '100px', resize: 'vertical' }}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Availability</label>
        <input
          type="date"
          onChange={(e) => addDate(e.target.value)}
          style={styles.input}
        />
        <div style={styles.tags}>
          {formData.availability.map(date => (
            <span key={date} style={styles.tag}>
              {new Date(date).toLocaleDateString()}
              <button onClick={() => removeDate(date)} style={styles.removeBtn}>×</button>
            </span>
          ))}
        </div>
      </div>
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};

const styles = {
  form: { padding: '20px' },
  formGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: '500' },
  input: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' },
  dropdown: { position: 'absolute', backgroundColor: 'white', border: '1px solid #ccc', padding: '10px', zIndex: 10 },
  dropdownItem: { display: 'block', marginBottom: '5px' },
  tags: { marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' },
  tag: { backgroundColor: '#e0f7fa', padding: '5px 10px', borderRadius: '15px', display: 'flex', alignItems: 'center' },
  removeBtn: { marginLeft: '5px', background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' },
  button: { width: '100%', padding: '10px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { color: 'red', marginBottom: '10px' },
};

export default ProfileForm;