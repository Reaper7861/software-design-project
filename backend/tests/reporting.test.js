// reporting.test.js unit tests

// Mock PDFKit
const mockPDFDocument = {
  fontSize: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  moveDown: jest.fn().mockReturnThis(),
  on: jest.fn().mockImplementation((event, callback) => {
    if (event === 'data') {
      callback(Buffer.from('mock pdf data'));
    }
    if (event === 'end') {
      callback();
    }
    return mockPDFDocument;
  }),
  end: jest.fn()
};

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => mockPDFDocument);
});

// Mock CSV Writer
const mockCsvWriter = {
  writeRecords: jest.fn().mockResolvedValue()
};

jest.mock('csv-writer', () => ({
  createObjectCsvWriter: jest.fn().mockReturnValue(mockCsvWriter)
}));

// Mock database
const mockSupabase = {
  from: jest.fn()
};

jest.mock('../src/config/databaseBackend', () => mockSupabase);

const ReportingService = require('../src/services/reportingService');

describe('ReportingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateVolunteerReport', () => {
    it('should generate PDF volunteer report successfully', async () => {
      const mockVolunteers = [
        {
          uid: 'user1',
          fullName: 'John Doe',
          address1: '123 Main St',
          address2: '',
          city: 'Houston',
          state: 'TX',
          zipCode: '77000',
          skills: ['Teaching', 'Cooking'],
          preferences: 'Work outdoors',
          availability: ['2025-07-20']
        }
      ];

      const mockCredentials = { email: 'john@example.com', role: 'volunteer' };
      const mockHistory = [
        {
          eventname: 'Food Drive',
          eventdate: '2024-01-15',
          participationstatus: 'completed'
        }
      ];

      // Mock the usercredentials query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockImplementation((fields) => {
              if (fields === 'uid, email, role') {
                return Promise.resolve({ 
                  data: [{ uid: 'user1', email: 'john@example.com', role: 'volunteer' }], 
                  error: null 
                });
              } else if (fields === 'email, role') {
                return {
                  eq: jest.fn().mockReturnThis(),
                  single: jest.fn().mockResolvedValue({ data: mockCredentials, error: null })
                };
              }
              return Promise.resolve({ data: [], error: null });
            })
          };
        }
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockVolunteers, error: null })
          };
        }
        if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      const result = await ReportingService.generateVolunteerReport('pdf');
      
      expect(result).toBeDefined();
      expect(mockPDFDocument.fontSize).toHaveBeenCalled();
      expect(mockPDFDocument.text).toHaveBeenCalled();
      expect(mockPDFDocument.end).toHaveBeenCalled();
    });

    it('should generate CSV volunteer report successfully', async () => {
      const mockVolunteers = [
        {
          uid: 'user1',
          fullName: 'John Doe',
          address1: '123 Main St',
          address2: '',
          city: 'Houston',
          state: 'TX',
          zipCode: '77000',
          skills: ['Teaching', 'Cooking'],
          preferences: 'Work outdoors',
          availability: ['2025-07-20']
        }
      ];

      const mockCredentials = { email: 'john@example.com', role: 'volunteer' };

      // Mock the usercredentials query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockImplementation((fields) => {
              if (fields === 'uid, email, role') {
                return Promise.resolve({ 
                  data: [{ uid: 'user1', email: 'john@example.com', role: 'volunteer' }], 
                  error: null 
                });
              } else if (fields === 'email, role') {
                return {
                  eq: jest.fn().mockReturnThis(),
                  single: jest.fn().mockResolvedValue({ data: mockCredentials, error: null })
                };
              }
              return Promise.resolve({ data: [], error: null });
            })
          };
        }
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockVolunteers, error: null })
          };
        }
        if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      const result = await ReportingService.generateVolunteerReport('csv');
      
      expect(result).toBe('volunteer_report.csv');
      expect(mockCsvWriter.writeRecords).toHaveBeenCalled();
    });

    it('should handle database error', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          };
        }
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      await expect(ReportingService.generateVolunteerReport('pdf'))
        .rejects.toThrow('Failed to generate volunteer report: Database error: Database error');
    });

    it('should handle unsupported format', async () => {
      const mockVolunteers = [
        {
          uid: 'user1',
          fullName: 'John Doe',
          address1: '123 Main St',
          address2: '',
          city: 'Houston',
          state: 'TX',
          zipCode: '77000',
          skills: ['Teaching', 'Cooking'],
          preferences: 'Work outdoors',
          availability: ['2025-07-20']
        }
      ];

      const mockCredentials = { email: 'john@example.com', role: 'volunteer' };

      // Mock the usercredentials query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockImplementation((fields) => {
              if (fields === 'uid, email, role') {
                return Promise.resolve({ 
                  data: [{ uid: 'user1', email: 'john@example.com', role: 'volunteer' }], 
                  error: null 
                });
              } else if (fields === 'email, role') {
                return {
                  eq: jest.fn().mockReturnThis(),
                  single: jest.fn().mockResolvedValue({ data: mockCredentials, error: null })
                };
              }
              return Promise.resolve({ data: [], error: null });
            })
          };
        }
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockVolunteers, error: null })
          };
        }
        if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      await expect(ReportingService.generateVolunteerReport('docx'))
        .rejects.toThrow('Failed to generate volunteer report: Unsupported format. Use "pdf" or "csv"');
    });

    it('should handle no volunteers found', async () => {
      // Mock the usercredentials query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      const result = await ReportingService.generateVolunteerReport('pdf');
      expect(result).toBeDefined();
      expect(mockPDFDocument.fontSize).toHaveBeenCalled();
      expect(mockPDFDocument.text).toHaveBeenCalled();
      expect(mockPDFDocument.end).toHaveBeenCalled();
    });
  });

  describe('generateEventReport', () => {
    it('should generate PDF event report successfully', async () => {
      const mockEvents = [
        {
          eventid: 1,
          eventname: 'Food Drive',
          eventdate: '2024-01-15',
          eventdescription: 'Help collect food donations',
          location: 'Community Center',
          requiredskills: ['Teamwork', 'Communication'],
          urgency: 'High'
        }
      ];

      const mockHistory = [
        {
          volunteername: 'John Doe',
          participationstatus: 'completed'
        }
      ];

      // Mock the eventdetails query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'eventdetails') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockEvents, error: null })
          };
        }
        if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      const result = await ReportingService.generateEventReport('pdf');
      
      expect(result).toBeDefined();
      expect(mockPDFDocument.fontSize).toHaveBeenCalled();
      expect(mockPDFDocument.text).toHaveBeenCalled();
      expect(mockPDFDocument.end).toHaveBeenCalled();
    });

    it('should generate CSV event report successfully', async () => {
      const mockEvents = [
        {
          eventid: 1,
          eventname: 'Food Drive',
          eventdate: '2024-01-15',
          eventdescription: 'Help collect food donations',
          location: 'Community Center',
          requiredskills: ['Teamwork', 'Communication'],
          urgency: 'High'
        }
      ];

      // Mock the eventdetails query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'eventdetails') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockEvents, error: null })
          };
        }
        if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      const result = await ReportingService.generateEventReport('csv');
      
      expect(result).toBe('event_report.csv');
      expect(mockCsvWriter.writeRecords).toHaveBeenCalled();
    });

    it('should handle database error', async () => {
      // Mock the eventdetails query to return error
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'eventdetails') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          };
        }
        if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      await expect(ReportingService.generateEventReport('pdf'))
        .rejects.toThrow('Failed to generate event report: Database error: Database error');
    });

    it('should handle unsupported format for event report', async () => {
      const mockEvents = [
        {
          eventid: 1,
          eventname: 'Food Drive',
          eventdate: '2024-01-15',
          eventdescription: 'Help collect food donations',
          location: 'Community Center',
          requiredskills: ['Teamwork', 'Communication'],
          urgency: 'High'
        }
      ];

      // Mock the eventdetails query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'eventdetails') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockEvents, error: null })
          };
        }
        if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      await expect(ReportingService.generateEventReport('docx'))
        .rejects.toThrow('Failed to generate event report: Unsupported format. Use "pdf" or "csv"');
    });

    it('should handle volunteer report with missing data fields', async () => {
      const mockVolunteers = [
        {
          uid: 'user1',
          fullName: 'John Doe',
          address1: null,
          address2: null,
          city: null,
          state: null,
          zipCode: null,
          skills: null,
          preferences: null,
          availability: null
        }
      ];

      const mockCredentials = { email: null, role: 'volunteer' };

      // Mock the usercredentials query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockImplementation((fields) => {
              if (fields === 'uid, email, role') {
                return Promise.resolve({ 
                  data: [{ uid: 'user1', email: null, role: 'volunteer' }], 
                  error: null 
                });
              } else if (fields === 'email, role') {
                return {
                  eq: jest.fn().mockReturnThis(),
                  single: jest.fn().mockResolvedValue({ data: mockCredentials, error: null })
                };
              }
              return Promise.resolve({ data: [], error: null });
            })
          };
        }
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockVolunteers, error: null })
          };
        }
        if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      const result = await ReportingService.generateVolunteerReport('pdf');
      
      expect(result).toBeDefined();
      expect(mockPDFDocument.fontSize).toHaveBeenCalled();
      expect(mockPDFDocument.text).toHaveBeenCalled();
      expect(mockPDFDocument.end).toHaveBeenCalled();
    });

    it('should handle PDF generation error', async () => {
      const mockVolunteers = [
        {
          uid: 'user1',
          fullName: 'John Doe',
          address1: '123 Main St',
          address2: '',
          city: 'Houston',
          state: 'TX',
          zipCode: '77000',
          skills: ['Teaching', 'Cooking'],
          preferences: 'Work outdoors',
          availability: ['2025-07-20']
        }
      ];

      const mockCredentials = { email: 'john@example.com', role: 'volunteer' };

      // Mock the usercredentials query
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockImplementation((fields) => {
              if (fields === 'uid, email, role') {
                return Promise.resolve({ 
                  data: [{ uid: 'user1', email: 'john@example.com', role: 'volunteer' }], 
                  error: null 
                });
              } else if (fields === 'email, role') {
                return {
                  eq: jest.fn().mockReturnThis(),
                  single: jest.fn().mockResolvedValue({ data: mockCredentials, error: null })
                };
              }
              return Promise.resolve({ data: [], error: null });
            })
          };
        }
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockVolunteers, error: null })
          };
        }
        if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      // Mock PDFDocument to throw an error
      const PDFDocument = require('pdfkit');
      PDFDocument.mockImplementation(() => {
        throw new Error('PDF generation failed');
      });

      await expect(ReportingService.generateVolunteerReport('pdf'))
        .rejects.toThrow('Failed to generate volunteer report: PDF generation failed');

      // Restore the original mock
      PDFDocument.mockImplementation(() => mockPDFDocument);
    });


    
  });
}); 

