'use strict';

import app from './app';
import dotenv from 'dotenv';
dotenv.config();

// Set the NODE_TLS_REJECT_UNAUTHORIZED environment variable to 0
// This allows the HTTPS request to proceed with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
if (process.env.NODE_ENV === 'development') {
    console.log('here');
}

const server = app();
server.listen({
    port: process.env.PORT ? +process.env.PORT : 3000
}, function (err, address) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server is running on: ${address}`);
});