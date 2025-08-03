const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

const supabase = require('../src/config/databaseBackend');
const reportRoutes = require('../src/routes/reportingRoutes');
const reportingService = require('../src/services/reportingService');

app = express();
app.use(express.json());
app.use('/api/reports', reportRoutes);

// Mocks
jest.mock('../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => next()
}));

jest.mock('../src/middleware/role', () => ({
  requireAdmin: (req, res, next) => next()
}));

jest.mock('../src/services/reportingService', () => ({
  generateVolunteerReport: jest.fn(),
  generateEventReport: jest.fn()
}));

jest.mock('fs');
jest.mock('path');

beforeAll(() => {
  // Mock path.join to return the input path
  path.join.mockImplementation((...args) => args.join('/'));
  
  // Mock file existence check to always return true for CSV files
  fs.existsSync.mockImplementation((filePath) => {
    return filePath.includes('.csv');
  });

  // Mock unlink to simulate successful delete without error
  fs.unlink.mockImplementation((path, cb) => {
    if (cb) cb(null);
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset the sendFile mock for each test
  jest.spyOn(express.response, 'sendFile').mockImplementation(function (filePath, callback) {
    this.set('Content-Type', 'text/csv');
    this.set('Content-Disposition', 'attachment; filename="test.csv"');
    this.send('name,email\nJohn,john@example.com');
    if (typeof callback === 'function') {
      callback(null); // call the callback with no error
    }
    return this;
  });
});

jest.mock('../src/config/databaseBackend', () => ({
  from: jest.fn()
}));

describe('ReportingController', () => {
    
  describe('GET /api/reports/volunteers', () => {
    it('should return a PDF file for volunteers', async () => {
      const fakePDFBuffer = Buffer.from('PDF content');
      reportingService.generateVolunteerReport.mockResolvedValue(fakePDFBuffer);

      const res = await request(app).get('/api/reports/volunteers?format=pdf');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('volunteer_report.pdf');
      expect(res.body).toEqual(expect.any(Buffer));
    });

    it('should return a CSV file for volunteers', async () => {
      const fakeCSVPath = 'tmp/volunteer_report.csv';
      reportingService.generateVolunteerReport.mockResolvedValue(fakeCSVPath);

      const res = await request(app).get('/api/reports/volunteers?format=csv');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('name,email');
    });

    it('should return 400 for invalid format', async () => {
      const res = await request(app).get('/api/reports/volunteers?format=txt');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid format');
    });

    it('should return 500 on internal error', async () => {
      reportingService.generateVolunteerReport.mockRejectedValue(new Error('Boom'));

      const res = await request(app).get('/api/reports/volunteers?format=pdf');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Report generation failed');
    });
  });

  describe('GET /api/reports/events', () => {
    it('should return a PDF file for events', async () => {
      const fakePDFBuffer = Buffer.from('PDF content');
      reportingService.generateEventReport.mockResolvedValue(fakePDFBuffer);

      const res = await request(app).get('/api/reports/events?format=pdf');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('event_report.pdf');
      expect(res.body).toEqual(expect.any(Buffer));
    });

    it('should return a CSV file for events', async () => {
      const fakeCSVPath = 'tmp/event_report.csv';
      reportingService.generateEventReport.mockResolvedValue(fakeCSVPath);

      const res = await request(app).get('/api/reports/events?format=csv');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('name,email');
    });

    it('should return 400 for invalid format', async () => {
      const res = await request(app).get('/api/reports/events?format=json');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid format');
    });

    it('should return 500 on error', async () => {
      reportingService.generateEventReport.mockRejectedValue(new Error('Kaboom'));

      const res = await request(app).get('/api/reports/events?format=pdf');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Report generation failed');
    });
  });

  describe('GET /api/reports/types', () => {
    it('should return available report types', async () => {
      const res = await request(app).get('/api/reports');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('reports');
      expect(res.body.reports.map(r => r.endpoint)).toEqual(
        expect.arrayContaining(['/api/reports/volunteers', '/api/reports/events'])
      );
    });
  });
});