'use strict';
import jwt from 'jsonwebtoken'; // Add this import
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import REPLY_STATUS from '../models/reply-status.model';
import dotenv from 'dotenv';
import { checkIsTenantAdmin } from '../services/userService';
import { cca } from '../config/msalConfig';
dotenv.config();

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
const routes = async (fastify: FastifyInstance, options) => {
    fastify.get('/isAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Extract authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return reply.code(REPLY_STATUS.UNAUTHORIZED).send({ 
            error: 'Missing or invalid authorization header' 
          });
        }

        // Extract token and decode to get tenant ID
        const token = authHeader.slice(7);
        const decoded: any = jwt.decode(token, { complete: true });
        
        if (!decoded?.payload?.tid) {
          return reply.code(REPLY_STATUS.UNAUTHORIZED).send({ 
            error: 'Invalid token: missing tenant ID' 
          });
        }

        const tid = decoded.payload.tid;

        // Call the user service to check admin status
        const adminCheckResult = await checkIsTenantAdmin({
          tid,
          oboAssertion: token,
          cca
        });

        // Return the admin status
        reply.code(REPLY_STATUS.OK).send({
          isAdmin: adminCheckResult.isAdmin,
          roles: adminCheckResult.roles,
          // Optionally include user info from token
          user: {
            tid: decoded.payload.tid,
            sub: decoded.payload.sub,
            name: decoded.payload.name,
            email: decoded.payload.preferred_username
          }
        });

      } catch (err) {
        console.error('Admin check error:', err);
        
        // Handle specific error types with appropriate status codes
        if (err.message.includes('OBO for Graph failed')) {
          return reply.code(REPLY_STATUS.UNAUTHORIZED).send({ 
            error: 'Token exchange failed' 
          });
        }
        
        if (err.message.includes('Graph me/memberOf call failed')) {
          return reply.code(REPLY_STATUS.FORBIDDEN).send({ 
            error: 'Insufficient permissions to check admin status' 
          });
        }

        reply.code(REPLY_STATUS.INTERNAL_SERVER_ERROR).send({ 
          error: 'Internal server error during admin check' 
        });
      }
    });
}

export default routes;