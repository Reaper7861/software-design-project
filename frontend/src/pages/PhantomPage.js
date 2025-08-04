import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const PhantomPage = () => {
    const { refreshProfileStatus } = useAuth();

    // create form with required fields
    const [formData, setFormData] = useState({
        fullName: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zipCode: '',
        skills: [],
        preferences: '',
        availability:[],
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
    const dropdownRef = useRef();

    const toggleSkillDropdown = () => {
    setSkillDropdownOpen(prev => !prev);
    };

    const toggleSkill = (skill, checked) => {
    setFormData(prev => {
        const newSkills = checked
        ? [...prev.skills, skill]
        : prev.skills.filter(s => s !== skill);
        return { ...prev, skills: newSkills };
    });
    };

    const removeSkill = (skill) => {
    setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s !== skill)
    }));
    };

    useEffect(() => {
    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSkillDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
    }, []);

    

    // array of skills
    const skillOptions = [
        'Communication',
        'Teamwork',
        'Leadership',
        'Event Planning',
        'Fundraising',
        'Public Speaking',
        'Teaching/Tutoring',
        'Childcare',
        'Elderly Support',
        'Community Outreach'
    ];    

    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // functions for adding and removing dates of availability
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
      

    // handles constraints
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
      
        // Validate form
        if (!formData.fullName || typeof formData.fullName !== 'string' || !formData.fullName.trim()) {
          setError('Full Name is required.');
          setLoading(false);
          return;
        }
        if (typeof formData.fullName !== 'string' || formData.fullName.length > 50) {
          setError('Full Name cannot exceed 50 characters.');
          setLoading(false);
          return;
        }
        if (!formData.address1 || typeof formData.address1 !== 'string' || !formData.address1.trim()) {
          setError('Address is required.');
          setLoading(false);
          return;
        }
        if ((typeof formData.address1 === 'string' && formData.address1.length > 100) || (formData.address2 && typeof formData.address2 === 'string' && formData.address2.length > 100)) {
          setError('Address fields cannot exceed 100 characters.');
          setLoading(false);
          return;
        }
        if (!formData.city || typeof formData.city !== 'string' || !formData.city.trim()) {
          setError('City is required.');
          setLoading(false);
          return;
        }
        if (typeof formData.city !== 'string' || formData.city.length > 100) {
          setError('City cannot exceed 100 characters.');
          setLoading(false);
          return;
        }
        if (!formData.state) {
          setError('Please select your state');
          setLoading(false);
          return;
        }
        if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
          setError('Zip Code must be 5 digits or 5+4 format (e.g. 12345 or 12345-6789)');
          setLoading(false);
          return;
        }
        if (!Array.isArray(formData.skills) || formData.skills.length === 0) {
          setError('Please select at least one skill');
          setLoading(false);
          return;
        }
        if (!Array.isArray(formData.availability) || formData.availability.length === 0) {
          setError('Please select at least one availability date.');
          setLoading(false);
          return;
        }
      
        // Attempt to submit to backend
        try {
          const user = auth.currentUser;
          if (!user) {
            setError('User not logged in');
            setLoading(false);
            return;
          }
      
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
      
          const updatedProfile = await res.json();
          console.log('Profile updated:', updatedProfile);
      
          // Refresh profile status to update the Navbar immediately
          await refreshProfileStatus();
      
          navigate('/profile');
        } catch (err) {
          console.error('Profile update failed:', err);
          setError(err.message || 'Update failed. Please try again.');
        } finally {
          setLoading(false);
        }
      };

    
    // actual text format 
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Complete Your Profile</h2>
                
                <div style={styles.infoBox}>
                    <p style={styles.infoText}>
                        <strong>Welcome!</strong> Please fill out the form below to complete your profile and gain full access to the volunteer platform!
                    </p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                        <label style={styles.label}>Full name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            maxLength={50}
                            style={styles.input}
                            placeholder="Enter Full name"
                            required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Address 1</label>
                            <input 
                                type="text"
                                name="address1"
                                value={formData.address1}
                                onChange={handleChange}
                                maxLength={100}
                                style={styles.input}
                                placeholder="Enter Address"
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Address 2</label>
                            <input 
                                type="text"
                                name="address2"
                                value={formData.address2}
                                onChange={handleChange}
                                maxLength={100}
                                style={styles.input}
                                placeholder="Enter Suite, Apt, Floor, etc."
                                
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
                                placeholder="Enter City"
                                required
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
                                    <option value="AL">Alabama</option>
                                    <option value="AK">Alaska</option>
                                    <option value="AZ">Arizona</option>
                                    <option value="AR">Arkansas</option>
                                    <option value="CA">California</option>
                                    <option value="CO">Colorado</option>
                                    <option value="CT">Connecticut</option>
                                    <option value="DE">Delaware</option>
                                    <option value="FL">Florida</option>
                                    <option value="GA">Georgia</option>
                                    <option value="HI">Hawaii</option>
                                    <option value="ID">Idaho</option>
                                    <option value="IL">Illinois</option>
                                    <option value="IN">Indiana</option>
                                    <option value="IA">Iowa</option>
                                    <option value="KS">Kansas</option>
                                    <option value="KY">Kentucky</option>
                                    <option value="LA">Louisiana</option>
                                    <option value="ME">Maine</option>
                                    <option value="MD">Maryland</option>
                                    <option value="MA">Massachusetts</option>
                                    <option value="MI">Michigan</option>
                                    <option value="MN">Minnesota</option>
                                    <option value="MS">Mississippi</option>
                                    <option value="MO">Missouri</option>
                                    <option value="MT">Montana</option>
                                    <option value="NE">Nebraska</option>
                                    <option value="NV">Nevada</option>
                                    <option value="NH">New Hampshire</option>
                                    <option value="NJ">New Jersey</option>
                                    <option value="NM">New Mexico</option>
                                    <option value="NY">New York</option>
                                    <option value="NC">North Carolina</option>
                                    <option value="ND">North Dakota</option>
                                    <option value="OH">Ohio</option>
                                    <option value="OK">Oklahoma</option>
                                    <option value="OR">Oregon</option>
                                    <option value="PA">Pennsylvania</option>
                                    <option value="RI">Rhode Island</option>
                                    <option value="SC">South Carolina</option>
                                    <option value="SD">South Dakota</option>
                                    <option value="TN">Tennessee</option>
                                    <option value="TX">Texas</option>
                                    <option value="UT">Utah</option>
                                    <option value="VT">Vermont</option>
                                    <option value="VA">Virginia</option>
                                    <option value="WA">Washington</option>
                                    <option value="WV">West Virginia</option>
                                    <option value="WI">Wisconsin</option>
                                    <option value="WY">Wyoming</option>
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
                                placeholder="Enter Zipcode (12345 or 12345-6789)"
                                maxLength={10}
                                required
                            />
                        </div>

                        



                        <div style={styles.formGroup} ref={dropdownRef}>
                        <label style={styles.label}>Skills <span style={{ color: 'red' }}>*</span></label>

                        <div
                            onClick={toggleSkillDropdown}
                            style={{
                            ...styles.input,
                            cursor: 'pointer',
                            position: 'relative',
                            userSelect: 'none',
                            backgroundColor: '#fff'
                            }}
                        >
                            {(!Array.isArray(formData.skills) || formData.skills.length === 0) ? 'Select skills...' : formData.skills.join(', ')}
                        </div>

                        {skillDropdownOpen && (
                            <div style={{
                            position: 'absolute',
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            marginTop: '0.25rem',
                            zIndex: 1000,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: '0.5rem',
                            width: '100%'
                            }}>
                            {skillOptions.map(skill => (
                                <label key={skill} style={{ display: 'block', marginBottom: '0.25rem' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.skills.includes(skill)}
                                    onChange={(e) => toggleSkill(skill, e.target.checked)}
                                />
                                {' '}
                                {skill}
                                </label>
                            ))}
                            </div>
                        )}

                        {/* Tags for selected skills */}
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {Array.isArray(formData.skills) && formData.skills.map(skill => (
                            <div
                                key={skill}
                                style={{
                                backgroundColor: '#3498db',
                                color: 'white',
                                borderRadius: '3px',
                                padding: '0.25rem 0.5rem',
                                display: 'flex',
                                alignItems: 'center'
                                }}
                            >
                                {skill}
                                <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                style={{
                                    marginLeft: '0.5rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                                >
                                ×
                                </button>
                            </div>
                            ))}
                        </div>
                        </div>







                        <div style={styles.formGroup}>
                        <label style={styles.label}>Preferences (optional)</label>
                            <textarea
                                name="preferences"
                                value={formData.preferences}
                                onChange={handleChange}
                                style={{ ...styles.input, height: '100px', resize: 'vertical' }}
                                placeholder="Enter any preferences here"
                            />
                        </div>

                        
                        <div style={styles.formGroup}>
                        <label style={styles.label}>
                            Availability (select one date at a time, required)
                        </label>

                        <input
                            type="date"
                            onChange={(e) => {
                                addDate(e.target.value);
                                e.target.value = '';
                            }}
                            style={styles.input}
                        />

                        <div style={{ marginTop: '0.5rem' }}>
                            {(!Array.isArray(formData.availability) || formData.availability.length === 0) && (
                            <p style={{ color: '#888' }}>No dates selected yet.</p>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {Array.isArray(formData.availability) && formData.availability.map(date => (
                                <div key={date} style={{ 
                                    backgroundColor: '#cce5ff',
                                    borderRadius: '15px',
                                    padding: '5px 10px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '14px'
                                }}>
                                    <span>{new Date(date).toLocaleDateString()}</span>
                                    <button
                                    type="button"
                                    onClick={() => removeDate(date)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        lineHeight: 1,
                                        padding: 0,
                                        color: 'red',
                                        fontWeight: 'bold'
                                    }}
                                    >
                                    ×
                                    </button>
                                </div>
                                ))}
                            </div>
                        </div>
                        </div>



                        

                        <button
                            type="submit"
                            style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update'}
                        </button>



                </form>

            </div>
        </div>
    );


};

// Styles sheet for our page (default for all)
    const styles = {

        container: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            padding: '20px'
        },
    
        card: {
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '400px'
        },
    
        title: {
            textAlign: 'center',
            marginBottom: '1.5rem',
            color: '#2c3e50'
        },
    
        formGroup: {
            marginBottom: '1rem'
        },
    
        label: {
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#555'
        },
    
        input: {
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            boxSizing: 'border-box'
        },
    
        button: {
            width: '100%',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginTop: '1rem'
        },
    
        buttonDisabled: {
            backgroundColor: '#bdc3c7',
            cursor: 'not-allowed'
        },
    
        error: {
            backgroundColor: '#fee',
            color: '#c0392b',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #f5c6cb'
        },

        infoBox: {
            backgroundColor: '#e8f4fd',
            border: '1px solid #bee5eb',
            borderRadius: '4px',
            padding: '1rem',
            marginBottom: '1.5rem'
        },

        infoText: {
            margin: '0',
            color: '#0c5460',
            fontSize: '0.9rem',
            lineHeight: '1.4'
        },
    
        linkText: {
            textAlign: 'center',
            marginTop: '1rem'
        },
    
        link: {
            color: '#3498db',
            textDecoration: 'none'
        }
    };
// export Profile Page to site
export default PhantomPage;