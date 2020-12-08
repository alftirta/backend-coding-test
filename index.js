'use strict';

require('dotenv').config();
const port = process.env.PORT || 8091;

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');

const logger = require('./src/logger');

db.serialize(() => {
  buildSchemas(db);

  const app = require('./src/app')(db);

  app.listen(port, () => logger.info(`App listening on port ${port}`));
});
