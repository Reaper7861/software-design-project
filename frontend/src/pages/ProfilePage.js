import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';


const ProfilePage = () => {

    // create form with required fields
    const [formData, setFormData] = useState({
        fullName: '',
        address1: '',
        address2: '',
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
        setError('');

        if (!formData.fullName.trim()) {
            setError('Full Name is required.');
            return;
          }
          
          if (formData.fullName.length > 50) {
            setError('Full Name cannot exceed 50 characters.');
            return;
          }


          if (!formData.address1.trim()) {
            setError('Address is required.');
            return;
          }
          
          if (formData.address1.length > 100) {
            setError('Address cannot exceed 100 characters.');
            return;
          }


          if (formData.address2.length > 100) {
            setError('Address cannot exceed 100 characters.');
            return;
          }

          if (formData.city.length > 100) {
            setError('City cannot exceed 100 characters.');
            return;
          }

          if (!formData.city.trim()) {
            setError('City is required.');
            return;
          }

        
        if (!formData.state) {
            setError('Please select your state');
            return;
        }


        if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
            setError('Zip Code must be 5 digits or 5+4 format (e.g. 12345 or 12345-6789)');
            return;
        }


        if (formData.skills.length === 0) {
            setError('Please select at least one skill');
            return;
        }


        if (formData.availability.length === 0) {
            setError('Please select at least one availability date.');
            return;
          }
          
        
    };


    // actual text format
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Profile</h2>

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

                        
                        <div style={styles.formGroup}>
                        <label style={styles.label}>Skills <span style={{ color: 'red' }}>*</span></label>
                            <select
                                multiple
                                name="skills"
                                value={formData.skills}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions).map(option => option.value);
                                    setFormData(prev => ({ ...prev, skills: selected }));
                                }}
                                style={{ ...styles.input, height: '120px' }}
                                
                            >
                                {skillOptions.map((skill) => (
                                    <option key={skill} value={skill}>
                                        {skill}
                                    </option>
                                ))}
                            </select>
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
                            onChange={(e) => addDate(e.target.value)}
                            style={styles.input}
                        />

                        <div style={{ marginTop: '0.5rem' }}>
                            {formData.availability.length === 0 && (
                            <p style={{ color: '#888' }}>No dates selected yet.</p>
                            )}

                            {formData.availability.map(date => (
                            <div key={date} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <span>{date}</span>
                                <button
                                type="button"
                                onClick={() => removeDate(date)}
                                style={{
                                    marginLeft: '10px',
                                    cursor: 'pointer',
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    padding: '0 6px'
                                }}
                                >
                                
                                </button>
                            </div>
                            ))}
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
export default ProfilePage;