import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../css/ReportingPage.css';

const ReportingPage = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let unsubscribe;
        let didCancel = false;

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (didCancel) return;
            if (!firebaseUser) {
                setError('User not logged in');
                return;
            }
            try {
                await fetchReportTypes();
            } catch (err) {
                console.error('Error in auth state change:', err);
            }
        });

        return () => {
            didCancel = true;
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const fetchReportTypes = async () => {
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) {
                throw new Error('No Firebase user found');
            }
            
            const token = await firebaseUser.getIdToken();
            const response = await fetch('http://localhost:8080/api/reports', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report types');
            }

            const data = await response.json();
            setReports(data.reports);
        } catch (err) {
            setError('Failed to load report types');
            console.error('Error fetching report types:', err);
        }
    };

    const generateReport = async (endpoint, format) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Get the Firebase user to access getIdToken
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) {
                throw new Error('No Firebase user found');
            }
            
            const token = await firebaseUser.getIdToken();
            const response = await fetch(`http://localhost:8080${endpoint}?format=${format}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate report');
            }

            // Get the filename from the response headers
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition 
                ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
                : `${endpoint.split('/').pop()}_report.${format}`;

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setSuccess(`Report generated successfully! File: ${filename}`);
        } catch (err) {
            setError(err.message || 'Failed to generate report');
            console.error('Error generating report:', err);
        } finally {
            setLoading(false);
        }
    };

    console.log('Current user:', user);
    console.log('User role:', user?.role);
    
    if (!user || (user.role !== 'admin' && user.role !== 'administrator')) {
        return (
            <div className="reporting-page">
                <div className="reporting-container">
                    <h1>Access Denied</h1>
                    <p>You need administrator privileges to access the reporting module.</p>
                    <p>Current user role: {user?.role || 'No role'}</p>
                </div>
            </div>
        );
    }

    return (
            <div className="reporting-container">
                <h1>Reporting Module</h1>
                <p className="reporting-description">
                    Generate comprehensive reports on volunteer activities and event management.
                </p>

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

                <div className="reports-grid">
                    {reports.map((report, index) => (
                        <div key={index} className="report-card">
                            <h3>{report.name}</h3>
                            <p>{report.description}</p>
                            
                            <div className="format-buttons">
                                {report.formats.map((format) => (
                                    <button
                                        key={format}
                                        onClick={() => generateReport(report.endpoint, format)}
                                        disabled={loading}
                                        className={`format-button ${format}`}
                                    >
                                        {loading ? 'Generating...' : `Download ${format.toUpperCase()}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {reports.length === 0 && !loading && (
                    <div className="no-reports">
                        <p>No reports available at the moment.</p>
                    </div>
                )}
            </div>
    );
};

export default ReportingPage; 