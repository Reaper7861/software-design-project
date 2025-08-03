// reporting.test.js unit tests

jest.mock('pdfkit');
jest.mock('csv-writer');
jest.mock('../src/config/databaseBackend', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  onConflict: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis()
}));

const ReportingService = require('../src/services/reportingService');
const supabase = require('../src/config/databaseBackend');

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
          availability: ['2025-07-20'],
          usercredentials: {
            email: 'john@example.com',
            role: 'volunteer'
          },
          volunteerhistory: [
            {
              eventname: 'Food Drive',
              eventdate: '2024-01-15',
              participationstatus: 'completed'
            }
          ]
        }
      ];

      supabase.order.mockResolvedValue({ data: mockVolunteers, error: null });
      supabase.single.mockResolvedValue({ data: { email: 'john@example.com', role: 'volunteer' }, error: null });

      const result = await ReportingService.generateVolunteerReport('pdf');
      
      expect(supabase.from).toHaveBeenCalledWith('userprofile');
      expect(supabase.select).toHaveBeenCalled();
      expect(result).toBeDefined();
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
          availability: ['2025-07-20'],
          usercredentials: {
            email: 'john@example.com',
            role: 'volunteer'
          },
          volunteerhistory: []
        }
      ];

      supabase.order.mockResolvedValue({ data: mockVolunteers, error: null });
      supabase.single.mockResolvedValue({ data: { email: 'john@example.com', role: 'volunteer' }, error: null });

      const result = await ReportingService.generateVolunteerReport('csv');
      
      expect(result).toBe('volunteer_report.csv');
    });

    it('should handle database error', async () => {
      supabase.order.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      await expect(ReportingService.generateVolunteerReport('pdf'))
        .rejects.toThrow('Failed to generate volunteer report: Database error: Database error');
    });

    it('should handle unsupported format', async () => {
      await expect(ReportingService.generateVolunteerReport('docx'))
        .rejects.toThrow('Failed to generate volunteer report: Unsupported format. Use "pdf" or "csv"');
    });

    it('should handle no volunteers found', async () => {
      supabase.order.mockResolvedValue({ data: [], error: null });

      const result = await ReportingService.generateVolunteerReport('pdf');
      expect(result).toBeDefined();
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
          urgency: 'High',
          volunteerhistory: [
            {
              volunteername: 'John Doe',
              participationstatus: 'completed'
            }
          ]
        }
      ];

      supabase.order.mockResolvedValue({ data: mockEvents, error: null });

      const result = await ReportingService.generateEventReport('pdf');
      
      expect(supabase.from).toHaveBeenCalledWith('eventdetails');
      expect(supabase.select).toHaveBeenCalled();
      expect(result).toBeDefined();
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
          urgency: 'High',
          volunteerhistory: []
        }
      ];

      supabase.order.mockResolvedValue({ data: mockEvents, error: null });

      const result = await ReportingService.generateEventReport('csv');
      
      expect(result).toBe('event_report.csv');
    });

    it('should handle database error', async () => {
      supabase.order.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      await expect(ReportingService.generateEventReport('pdf'))
        .rejects.toThrow('Failed to generate event report: Database error: Database error');
    });
  });
}); 