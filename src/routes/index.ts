'use strict';
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import REPLY_STATUS from '../models/reply-status.model';
import axios, { AxiosResponse } from "axios";
import dotenv from 'dotenv';
import { Session } from '@fastify/secure-session';
import { Entity } from "redis-om";
dotenv.config();

interface ResolveSessionData {
  resolveSession: string;
}

declare module "fastify" {
  interface FastifyRequest {
    resolveSession: Session<ResolveSessionData>;
  }
}

// Set the NODE_TLS_REJECT_UNAUTHORIZED environment variable to 0
// This allows the HTTPS request to proceed with self-signed certificates
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
const routes = async (fastify: FastifyInstance, options) => {
    fastify.get('/redirect', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const getRedirectURLResponse = await axios.get(process.env.REDIRECT_URL);
        if (getRedirectURLResponse.data.url) {
          reply.code(REPLY_STATUS.OK).send({ url: getRedirectURLResponse.data.url });
        } else {
          reply.code(REPLY_STATUS.NOT_FOUND);
        }
      } catch (err) {
        console.error(err);
        reply.code(REPLY_STATUS.INTERNAL_SERVER_ERROR);
      }
    });

    fastify.post('/token', async (request: FastifyRequest, reply: FastifyReply) => {

    });
}

export default routes;