const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const supabase = require('../config/databaseBackend');

class ReportingService {
    // Generate volunteer participation history report
    async generateVolunteerReport(format = 'pdf') {
        try {
            // First, let's check what users exist
            const { data: allUsers, error: userError } = await supabase
                .from('usercredentials')
                .select('uid, email, role');
            
            console.log('All users in database:', allUsers);

            // Fetch volunteer data with participation history
            const { data: volunteers, error } = await supabase
                .from('userprofile')
                .select(`
                    uid,
                    "fullName",
                    address1,
                    address2,
                    city,
                    state,
                    "zipCode",
                    skills,
                    preferences,
                    availability
                `)
                .order('"fullName"');

            console.log('Volunteers from userprofile:', volunteers);

            // Now get the email and role for each volunteer
            const volunteersWithCredentials = await Promise.all(
                (volunteers || []).map(async (volunteer) => {
                    const { data: credentials } = await supabase
                        .from('usercredentials')
                        .select('email, role')
                        .eq('uid', volunteer.uid)
                        .single();
                    
                    return { 
                        ...volunteer, 
                        usercredentials: credentials,
                        volunteerhistory: [] // Initialize empty history
                    };
                })
            );

            // Filter to only volunteers
            const filteredVolunteers = volunteersWithCredentials.filter(v => v.usercredentials?.role === 'volunteer');
            console.log('Filtered volunteers:', filteredVolunteers);

            console.log('Volunteers query result:', { volunteers, error });

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            if (!filteredVolunteers || filteredVolunteers.length === 0) {
                console.log('No volunteers found');
                return format === 'pdf' ? await this.generateVolunteerPDF([]) : await this.generateVolunteerCSV([]);
            }

            // Fetch volunteer history for each volunteer
            const volunteersWithHistory = await Promise.all(
                filteredVolunteers.map(async (volunteer) => {
                    const { data: history } = await supabase
                        .from('volunteerhistory')
                        .select('*')
                        .eq('uid', volunteer.uid);
                    return { ...volunteer, volunteerhistory: history || [] };
                })
            );

            if (format === 'pdf') {
                return await this.generateVolunteerPDF(volunteersWithHistory);
            } else if (format === 'csv') {
                return await this.generateVolunteerCSV(volunteersWithHistory);
            } else {
                throw new Error('Unsupported format. Use "pdf" or "csv"');
            }
        } catch (error) {
            throw new Error(`Failed to generate volunteer report: ${error.message}`);
        }
    }

    // Generate event management report
    async generateEventReport(format = 'pdf') {
        try {
            // Fetch event data with volunteer assignments
            const { data: events, error } = await supabase
                .from('eventdetails')
                .select(`
                    eventid,
                    eventname,
                    eventdescription,
                    location,
                    requiredskills,
                    urgency,
                    eventdate
                `)
                .order('eventdate', { ascending: false });

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            // Fetch volunteer history for each event
            const eventsWithHistory = await Promise.all(
                (events || []).map(async (event) => {
                    const { data: history } = await supabase
                        .from('volunteerhistory')
                        .select('*')
                        .eq('eventid', event.eventid);
                    return { ...event, volunteerhistory: history || [] };
                })
            );

            if (format === 'pdf') {
                return await this.generateEventPDF(eventsWithHistory);
            } else if (format === 'csv') {
                return await this.generateEventCSV(eventsWithHistory);
            } else {
                throw new Error('Unsupported format. Use "pdf" or "csv"');
            }
        } catch (error) {
            throw new Error(`Failed to generate event report: ${error.message}`);
        }
    }

    // Generate PDF for volunteer report
    async generateVolunteerPDF(volunteers) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Add title
                doc.fontSize(20).text('Volunteer Participation Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
                doc.moveDown(2);

                if (!volunteers || volunteers.length === 0) {
                    doc.fontSize(14).text('No volunteers found in the database.', { align: 'center' });
                    doc.end();
                    return;
                }

                // Add volunteer information
                volunteers.forEach((volunteer, index) => {
                    doc.fontSize(16).text(`${index + 1}. ${volunteer.fullName}`, { underline: true });
                    doc.fontSize(12).text(`Email: ${volunteer.usercredentials?.email || 'Not provided'}`);
                    
                    // Format address
                    const address = [
                        volunteer.address1,
                        volunteer.address2,
                        volunteer.city,
                        volunteer.state,
                        volunteer.zipCode
                    ].filter(Boolean).join(', ');
                    doc.fontSize(12).text(`Address: ${address || 'Not provided'}`);
                    
                    doc.fontSize(12).text(`Skills: ${volunteer.skills?.join(', ') || 'Not specified'}`);
                    doc.fontSize(12).text(`Preferences: ${volunteer.preferences || 'Not specified'}`);
                    doc.moveDown();

                    // Add participation history
                    if (volunteer.volunteerhistory && volunteer.volunteerhistory.length > 0) {
                        doc.fontSize(14).text('Participation History:', { underline: true });
                        volunteer.volunteerhistory.forEach(history => {
                            doc.fontSize(10).text(`  • ${history.eventname} (${history.eventdate}) - Status: ${history.participationstatus}`);
                        });
                    } else {
                        doc.fontSize(10).text('No participation history available.');
                    }
                    doc.moveDown(2);
                });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    // Generate CSV for volunteer report
    async generateVolunteerCSV(volunteers) {
        const csvWriter = createCsvWriter({
            path: 'volunteer_report.csv',
            header: [
                { id: 'fullName', title: 'Full Name' },
                { id: 'email', title: 'Email' },
                { id: 'address', title: 'Address' },
                { id: 'skills', title: 'Skills' },
                { id: 'preferences', title: 'Preferences' },
                { id: 'participationHistory', title: 'Participation History' }
            ]
        });

        if (!volunteers || volunteers.length === 0) {
            const records = [{
                fullName: 'No volunteers found',
                email: '',
                address: '',
                skills: '',
                preferences: '',
                participationHistory: ''
            }];
            await csvWriter.writeRecords(records);
            return 'volunteer_report.csv';
        }

        const records = volunteers.map(volunteer => {
            const address = [
                volunteer.address1,
                volunteer.address2,
                volunteer.city,
                volunteer.state,
                volunteer.zipCode
            ].filter(Boolean).join(', ');
            
            const participationHistory = volunteer.volunteerhistory && volunteer.volunteerhistory.length > 0
                ? volunteer.volunteerhistory.map(h => `${h.eventname} (${h.eventdate}) - ${h.participationstatus}`).join('; ')
                : 'No history';
            
            return {
                fullName: volunteer.fullName,
                email: volunteer.usercredentials?.email || 'Not provided',
                address: address || 'Not provided',
                skills: volunteer.skills?.join(', ') || 'Not specified',
                preferences: volunteer.preferences || 'Not specified',
                participationHistory: participationHistory
            };
        });

        await csvWriter.writeRecords(records);
        return 'volunteer_report.csv';
    }

    // Generate PDF for event report
    async generateEventPDF(events) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Add title
                doc.fontSize(20).text('Event Management Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
                doc.moveDown(2);

                // Add event information
                events.forEach((event, index) => {
                    doc.fontSize(16).text(`${index + 1}. ${event.eventname}`, { underline: true });
                    doc.fontSize(12).text(`Event ID: ${event.eventid}`);
                    doc.fontSize(12).text(`Date: ${new Date(event.eventdate).toLocaleDateString()}`);
                    doc.fontSize(12).text(`Location: ${event.location}`);
                    doc.fontSize(12).text(`Description: ${event.eventdescription || 'No description'}`);
                    doc.fontSize(12).text(`Required Skills: ${event.requiredskills?.join(', ') || 'None specified'}`);
                    doc.fontSize(12).text(`Urgency: ${event.urgency}`);
                    doc.moveDown();

                    // Add volunteer assignments
                    if (event.volunteerhistory && event.volunteerhistory.length > 0) {
                        doc.fontSize(14).text('Volunteer Assignments:', { underline: true });
                        event.volunteerhistory.forEach(assignment => {
                            doc.fontSize(10).text(`  • ${assignment.volunteername} - Status: ${assignment.participationstatus}`);
                        });
                    } else {
                        doc.fontSize(10).text('No volunteer assignments available.');
                    }
                    doc.moveDown(2);
                });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    // Generate CSV for event report
    async generateEventCSV(events) {
        const csvWriter = createCsvWriter({
            path: 'event_report.csv',
            header: [
                { id: 'eventId', title: 'Event ID' },
                { id: 'eventName', title: 'Event Name' },
                { id: 'eventDate', title: 'Event Date' },
                { id: 'location', title: 'Location' },
                { id: 'eventDescription', title: 'Description' },
                { id: 'requiredSkills', title: 'Required Skills' },
                { id: 'urgency', title: 'Urgency' },
                { id: 'volunteerAssignments', title: 'Volunteer Assignments' }
            ]
        });

        const records = events.map(event => {
            const volunteerAssignments = event.volunteerhistory && event.volunteerhistory.length > 0
                ? event.volunteerhistory.map(a => `${a.volunteername} - ${a.participationstatus}`).join('; ')
                : 'No assignments';
            
            return {
                eventId: event.eventid,
                eventName: event.eventname,
                eventDate: new Date(event.eventdate).toLocaleDateString(),
                location: event.location,
                eventDescription: event.eventdescription,
                requiredSkills: event.requiredskills?.join(', ') || 'None specified',
                urgency: event.urgency,
                volunteerAssignments: volunteerAssignments
            };
        });

        await csvWriter.writeRecords(records);
        return 'event_report.csv';
    }
}

module.exports = new ReportingService(); 