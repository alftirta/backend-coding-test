'use strict';

require("dotenv").config()
const express = require('express');
const app = express();
const port = process.env.PORT || 8091;

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');

db.serialize(() => {
    buildSchemas(db);

    const app = require('./src/app')(db);

    app.listen(port, () => console.log(`App listening on port ${port}`));
});