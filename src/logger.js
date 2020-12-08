const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(format.timestamp(), format.simple()),
    }),
    new transports.Console({
      level: 'error',
      format: format.combine(format.timestamp(), format.simple()),
    }),
    new transports.File({
      filename: 'logger.log',
      format: format.combine(format.timestamp(), format.json()),
    })
  ]
});

module.exports = logger;
