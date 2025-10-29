'use strict';

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import routes from './src/routes';
import { verify } from './src/handlers/auth';
import path from 'path';
import fs from 'fs';
import { Http2SecureServer } from 'http2';
dotenv.config();

export default (): FastifyInstance<Http2SecureServer> => {
  const fastify = Fastify({
    logger: true,
    http2: true,
    https: {
      allowHTTP1: true,
      key: fs.readFileSync(path.join(path.dirname(''), "certs", "localhost+2-key.pem")), // Path to private key
      cert: fs.readFileSync(path.join(path.dirname(''), "certs", "localhost+2.pem")), // Path to certificate
    }
  });

  fastify.register(cors, {
    origin: [process.env.WEB_URL],
    credentials: true
  });

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
  
  fastify.addHook('preHandler', verify);
  // fastify.register();

  fastify.register(routes);
  
  return fastify;
}