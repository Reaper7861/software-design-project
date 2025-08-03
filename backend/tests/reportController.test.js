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
beforeAll(() => {
  // Mock file existence check to always true (pretend CSV files exist)
  fs.existsSync.mockReturnValue(true);

  // Mock unlink to simulate successful delete without error
  fs.unlink.mockImplementation((path, cb) => cb(null));

  // Mock express res.sendFile to call callback immediately to prevent hanging
  jest.spyOn(express.response, 'sendFile').mockImplementation(function (filePath, callback) {
    if (typeof callback === 'function') {
        callback(); // call the callback immediately to avoid hanging
    }
    return this;
    });
});

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock('../src/config/databaseBackend', () => ({
  from: jest.fn()
}));

describe('ReportingController', () => {
    
  describe('GET /api/reports/volunteers', () => {
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

    it('should return a CSV file for volunteers', async () => {  /////////WORKKK
        const fakeCSVPath = 'tmp/volunteer_report.csv';
        const fakeCsvContent = 'name,email\nJohn,john@example.com';

        reportingService.generateVolunteerReport.mockResolvedValue(fakeCSVPath);

        // Mock fs.existsSync for this path
        fs.existsSync.mockImplementation((p) => p === fakeCSVPath);

        // Mock sendFile to simulate sending the CSV file content
        jest.spyOn(express.response, 'sendFile').mockImplementation(function (_path, callback) {
            this.set('Content-Type', 'text/csv');
            this.send(fakeCsvContent);
            if (typeof callback === 'function') callback();
            return this;
        });

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
      expect(res.headers['content-type']).toBe('text/csv');
      // Same note about res.text as above
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