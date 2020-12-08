'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

describe('API tests', () => {
  before(async (done) => {
    await db.serialize((err) => { 
      if (err) {
        return done(err);
      }

      buildSchemas(db);

      done();
    });
  });

  describe('GET /', () => {
    it('should return ok', (done) => {
      request(app)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
  });

  describe('POST /rides', () => {
    it('should return "Start latitude and longitude must be between -75 to 75 and -195 to 195 degrees respectively"', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: '-76',
          start_long: '-196',
          end_lat: '75',
          end_long: '195',
          rider_name: null,
          driver_name: null,
          driver_vehicle: null,
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          code: 0,
          message: 'Start latitude and longitude must be between -75 to 75 and -195 to 195 degrees respectively',
          data: null,
        }, done);
    });

    it('should return "End latitude and longitude must be between -75 to 75 and -195 to 195 degrees respectively"', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: '-75',
          start_long: '-195',
          end_lat: '76',
          end_long: '196',
          rider_name: null,
          driver_name: null,
          driver_vehicle: null,
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          code: 0,
          message: 'End latitude and longitude must be between -75 to 75 and -195 to 195 degrees respectively',
          data: null,
        }, done);
    });

    it('should return "Rider name must be a non empty string"', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: '-75',
          start_long: '-195',
          end_lat: '75',
          end_long: '195',
          rider_name: 123,
          driver_name: null,
          driver_vehicle: null,
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          code: 0,
          message: 'Rider name must be a non empty string',
          data: null,
        }, done);
    });

    it('should return "Driver name must be a non empty string"', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: '-75',
          start_long: '-195',
          end_lat: '75',
          end_long: '195',
          rider_name: 'rider\'s name',
          driver_name: 123,
          driver_vehicle: null,
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          code: 0,
          message: 'Driver name must be a non empty string',
          data: null,
        }, done);
    });

    it('should return "Driver vehicle must be a non empty string"', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: '-75',
          start_long: '-195',
          end_lat: '75',
          end_long: '195',
          rider_name: 'rider\'s name',
          driver_name: 'driver\'s vehicle',
          driver_vehicle: 123,
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          code: 0,
          message: 'Driver vehicle must be a non empty string',
          data: null,
        }, done);
    });

    it('should return "Unknown error"', (done) => {
      request(app)
        .post('/rides')
        .send({
          rider_name: 'rider\'s name',
          driver_name: 'driver\'s vehicle',
          driver_vehicle: 'driver\'s vehicle',
        })
        .expect('Content-Type', /json/)
        .expect(400, {
          code: 0,
          message: 'Unknown error',
          data: null,
        }, done);
    });

    it('should return the new ride created', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: '-75',
          start_long: '-195',
          end_lat: '75',
          end_long: '195',
          rider_name: 'rider\'s name',
          driver_name: 'driver\'s name',
          driver_vehicle: 'driver\'s vehicle',
        })
        .expect('Content-Type', /json/)
        .expect(200, [{
          rideID: 1,
          startLat: -75,
          startLong: -195,
          endLat: 75,
          endLong: 195,
          riderName: 'rider\'s name',
          driverName: 'driver\'s name',
          driverVehicle: 'driver\'s vehicle',
          created: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        }], done);
    });
  });

  describe('GET /rides', () => {
    before(async (done) => {
      await db.serialize((err) => { 
        if (err) {
          return done(err);
        }

        db.run('DELETE FROM Rides');

        done();
      });
    });

    afterEach(async (done) => {
      await db.serialize((err) => { 
        if (err) {
          return done(err);
        }

        const values = [-75, -195, 75, 195, 'rider\'s name', 'driver\'s name', 'driver\'s vehicle'];
        const query = `INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.run(query, values);

        done();
      });
    });

    it('should return "Could not find any rides"', (done) => {
      request(app)
        .get('/rides')
        .expect('Content-Type', /json/)
        .expect(400, {
          code: 0,
          message: 'Could not find any rides',
          data: null,
        }, done);
    });

    it('should return all rides with default pagination settings', (done) => {
      request(app)
        .get('/rides')
        .expect('Content-Type', /json/)
        .expect(200, {
          total_results: 1,
          page: 1,
          per_page: 5,
          total_pages: 1,
          rides: [{
            rideID: 2,
            startLat: -75,
            startLong: -195,
            endLat: 75,
            endLong: 195,
            riderName: 'rider\'s name',
            driverName: 'driver\'s name',
            driverVehicle: 'driver\'s vehicle',
            created: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
          }],
        }, done);
    });

    it('should return all rides with specified pagination settings', (done) => {
      request(app)
        .get('/rides?page=1&per_page=1')
        .expect('Content-Type', /json/)
        .expect(200, {
          total_results: 2,
          page: 1,
          per_page: 1,
          total_pages: 2,
          rides: [{
            rideID: 2,
            startLat: -75,
            startLong: -195,
            endLat: 75,
            endLong: 195,
            riderName: 'rider\'s name',
            driverName: 'driver\'s name',
            driverVehicle: 'driver\'s vehicle',
            created: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
          }],
        }, done);
    });
  });

  describe('GET /rides/:id', () => {
    it('should return "Could not find any rides"', (done) => {
      request(app)
        .get('/rides/1')
        .expect('Content-Type', /json/)
        .expect(400, {
          code: 0,
          message: 'Could not find any rides',
          data: null
        }, done);
    });

    it('should return a ride by its id', (done) => {
      request(app)
        .get('/rides/2')
        .expect('Content-Type', /json/)
        .expect(200, [{
          rideID: 2,
          startLat: -75,
          startLong: -195,
          endLat: 75,
          endLong: 195,
          riderName: 'rider\'s name',
          driverName: 'driver\'s name',
          driverVehicle: 'driver\'s vehicle',
          created: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        }], done);
    });
  });
});
