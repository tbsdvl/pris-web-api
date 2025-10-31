'use strict';

import jwt, { Algorithm } from "jsonwebtoken";
import dotenv from 'dotenv';
import HttpStatus from '../schemas/http-status.model.js';
import { authError, generalError } from "../../../shared/utils/error-message-utility.js";
import { failure } from "../utils/reply-utility.js";
import { AuthenticatedUser, AzureAdJwt, AzureAdJwtPayload } from "../schemas/jwt-types.model.js";
import { verifyJwt } from "../../../infrastructure/security/JwtVerifier.js";
dotenv.config();

export async function verify(req, reply) {
  try {
    const raw = req.headers.authorization;
    if (!raw?.startsWith("Bearer ")) {
      return failure(
        reply,
        HttpStatus.UNAUTHORIZED,
        authError('NO_BEARER_TOKEN'),
      );
    }
    const token = raw.slice(7);
    const decoded = jwt.decode(token, { complete: true }) as AzureAdJwt;
    if (!decoded) {
      return failure(
        reply,
        HttpStatus.UNAUTHORIZED,
        authError('NO_BEARER_TOKEN'),
      );
    }

    const { tid, iss, aud } = decoded?.payload;
    if (!tid || !iss) {
      return failure(
        reply,
        HttpStatus.UNAUTHORIZED,
        authError('NO_BEARER_TOKEN'),
      );
    }

    const verified = await verifyJwt(
      token,
      iss,
      [
        process.env.CLIENT_ID,
        `api://${process.env.CLIENT_ID}`,
      ],
      process.env.ALGORITHM as Algorithm,
      +process.env.CACHE_MAX_AGE
    ) as AzureAdJwtPayload;

    const user: AuthenticatedUser = { 
      tid, 
      sub: verified.sub, 
      token, 
      iss, 
      aud,
      name: verified.name,
      email: verified.preferred_username || verified.email
    };
    req.user = user;
  } catch (error) {
    return failure(
      reply,
      HttpStatus.INTERNAL_SERVER_ERROR,
      generalError('INTERNAL_SERVER_ERROR'),
      error.message
    );
  }
}