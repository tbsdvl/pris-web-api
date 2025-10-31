'use strict';

import { FastifyReply } from 'fastify';
import HttpStatus from '../schemas/http-status.model.js';
import { Payload } from '../schemas/payload.model.js';

export const failure = (
  reply: FastifyReply,
  statusCode: number,
  errorMessage: string,
  details?: string,
) => {
  const payload: Payload = {
    error: errorMessage,
    details: details,
    success: false,
    data: null,
  };
  return reply.code(statusCode).send(payload);
}

export const success = (
  reply: FastifyReply,
  data?: unknown,
  statusCode: number = HttpStatus.OK
) => {
  const payload: Payload = {
    error: null,
    details: null,
    success: true,
    data: data,
  };
  
  return reply.code(statusCode).send(payload);
}