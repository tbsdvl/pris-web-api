'use strict';

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import routes from './src/routes';
import { authPlugin } from './src/handlers/auth';
dotenv.config();

export default (): FastifyInstance => {
  const fastify = Fastify({
    logger: true,
  });

  fastify.register(authPlugin);

  fastify.register(fastifyCookie, {
    secret: process.env.JWT_SECRET,
    hook: 'onRequest',
    parseOptions: {
      signed: true,
      httpOnly: true,
      secure: true,
      maxAge: +(process.env.MAX_AGE || '3600')
    }
  });
  
  fastify.register(cors, {
    origin: [process.env.WEB_URL],
    credentials: true
  });

  fastify.register(routes);
  
  return fastify;
}