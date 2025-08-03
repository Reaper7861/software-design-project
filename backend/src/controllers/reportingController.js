const reportingService = require('../services/reportingService');
const fs = require('fs');
const path = require('path');

class ReportingController {
    // Generate volunteer participation report
    async generateVolunteerReport(req, res) {
        try {
            const { format = 'pdf' } = req.query;
            
            if (!['pdf', 'csv'].includes(format)) {
                return res.status(400).json({
                    error: 'Invalid format',
                    message: 'Format must be either "pdf" or "csv"'
                });
            }

            const result = await reportingService.generateVolunteerReport(format);
            
            if (format === 'pdf') {
                // Set headers for PDF download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="volunteer_report.pdf"');
                res.send(result);
            } else {
                // For CSV, result is the filename
                const filePath = path.join(process.cwd(), result);
                
                if (fs.existsSync(filePath)) {
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', 'attachment; filename="volunteer_report.csv"');
                    res.sendFile(filePath, (err) => {
                        if (err) {
                            console.error('Error sending CSV file:', err);
                        }
                        // Clean up the temporary file
                        fs.unlink(filePath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error('Error deleting temporary CSV file:', unlinkErr);
                            }
                        });
                    });
                } else {
                    res.status(500).json({
                        error: 'File generation failed',
                        message: 'CSV file was not created successfully'
                    });
                }
            }
        } catch (error) {
            console.error('Volunteer report generation error:', error);
            res.status(500).json({
                error: 'Report generation failed',
                message: error.message
            });
        }
    }

    // Generate event management report
    async generateEventReport(req, res) {
        try {
            const { format = 'pdf' } = req.query;
            
            if (!['pdf', 'csv'].includes(format)) {
                return res.status(400).json({
                    error: 'Invalid format',
                    message: 'Format must be either "pdf" or "csv"'
                });
            }

            const result = await reportingService.generateEventReport(format);
            
            if (format === 'pdf') {
                // Set headers for PDF download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="event_report.pdf"');
                res.send(result);
            } else {
                // For CSV, result is the filename
                const filePath = path.join(process.cwd(), result);
                
                if (fs.existsSync(filePath)) {
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', 'attachment; filename="event_report.csv"');
                    res.sendFile(filePath, (err) => {
                        if (err) {
                            console.error('Error sending CSV file:', err);
                        }
                        // Clean up the temporary file
                        fs.unlink(filePath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error('Error deleting temporary CSV file:', unlinkErr);
                            }
                        });
                    });
                } else {
                    res.status(500).json({
                        error: 'File generation failed',
                        message: 'CSV file was not created successfully'
                    });
                }
            }
        } catch (error) {
            console.error('Event report generation error:', error);
            res.status(500).json({
                error: 'Report generation failed',
                message: error.message
            });
        }
    }

    // Get available report types
    async getReportTypes(req, res) {
        try {
            res.json({
                reports: [
                    {
                        name: 'Volunteer Participation Report',
                        endpoint: '/api/reports/volunteers',
                        description: 'List of volunteers and their participation history',
                        formats: ['pdf', 'csv']
                    },
                    {
                        name: 'Event Management Report',
                        endpoint: '/api/reports/events',
                        description: 'Event details and volunteer assignments',
                        formats: ['pdf', 'csv']
                    }
                ]
            });
        } catch (error) {
            console.error('Error getting report types:', error);
            res.status(500).json({
                error: 'Failed to get report types',
                message: error.message
            });
        }
    }
}

module.exports = new ReportingController(); 