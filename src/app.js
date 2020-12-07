'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

module.exports = (db) => {
  app.get('/', (req, res) => {
    res.status(200).json({
      code: 1, message: 'ok', data: null
    });
  });

  app.post('/rides', jsonParser, (req, res) => {
    const {start_lat, start_long, end_lat, end_long, rider_name, driver_name, driver_vehicle} = req.body;

    if (Number(start_lat) < -75 || Number(start_lat) > 75 || Number(start_long) < -195 || Number(start_long) > 195) {
      return res.status(400).json({
        code: 0,
        message: 'Start latitude and longitude must be between -75 to 75 and -195 to 195 degrees respectively',
        data: null
      });
    }

    if (Number(end_lat) < -75 || Number(end_lat) > 75 || Number(end_long) < -195 || Number(end_long) > 195) {
      return res.status(400).json({
        code: 0,
        message: 'End latitude and longitude must be between -75 to 75 and -195 to 195 degrees respectively',
        data: null
      });
    }

    if (typeof rider_name !== 'string' || rider_name.length < 1) {
      return res.status(400).json({
        code: 0,
        message: 'Rider name must be a non empty string',
        data: null
      });
    }

    if (typeof driver_name !== 'string' || driver_name.length < 1) {
      return res.status(400).json({
        code: 0,
        message: 'Driver name must be a non empty string',
        data: null
      });
    }

    if (typeof driver_vehicle !== 'string' || driver_vehicle.length < 1) {
      return res.status(400).json({
        code: 0,
        message: 'Driver vehicle must be a non empty string',
        data: null
      });
    }

    const values = [start_lat, start_long, end_lat, end_long, rider_name, driver_name, driver_vehicle];
    const query = `INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, values, function (err) {
      if (err) {
        return res.status(400).json({
          code: 0,
          message: 'Unknown error',
          data: null
        });
      }

      db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, (err, rows) => {
        if (err) {
          return res.status(400).json({
            code: 0,
            message: 'Unknown error',
            data: null
          });
        }

        res.send(rows);
      });
    });
  });

  app.get('/rides', (req, res) => {
    db.all('SELECT * FROM Rides', (err, rows) => {
      if (err) {
        return res.status(400).json({
          code: 0,
          message: 'Unknown error',
          data: null
        });
      }

      if (rows.length === 0) {
        return res.status(400).json({
          code: 0,
          message: 'Could not find any rides',
          data: null
        });
      }

      const result = {};

      result.total_results = rows.length;

      result.page = +req.query.page || 1;
      result.per_page = +req.query.per_page || 5;
      result.total_pages = Math.ceil(result.total_results / result.per_page);

      const start = (result.page - 1) * result.per_page;
      const end = result.page * result.per_page;
      result.rides = rows.slice(start, end);

      res.send(result);
    });
  });

  app.get('/rides/:id', (req, res) => {
    db.all(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`, (err, rows) => {
      if (err) {
        return res.status(400).json({
          code: 0,
          message: 'Unknown error',
          data: null
        });
      }

      if (rows.length === 0) {
        return res.status(400).json({
          code: 0,
          message: 'Could not find any rides',
          data: null
        });
      }

      res.send(rows);
    });
  });

  return app;
};
