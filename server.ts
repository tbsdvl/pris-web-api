'use strict';

import app from './app';
import dotenv from 'dotenv';
dotenv.config();

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