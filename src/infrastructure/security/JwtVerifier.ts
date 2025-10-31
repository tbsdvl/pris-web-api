'use strict';

import jwt, { Algorithm, Jwt, JwtPayload } from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";

type VerifyDeps = { cacheMaxAge: number };
const clients = new Map<string, JwksClient>();

const getClient = (iss: string, cfg: VerifyDeps): JwksClient =>
  clients.get(iss) ?? clients.set(iss,
    jwksClient({ jwksUri: `${iss}/discovery/v2.0/keys`, cache: true, cacheMaxAge: cfg.cacheMaxAge, rateLimit: true })
  ).get(iss)!;

const getKey = async (client: JwksClient, decoded: Jwt) => {
  const key = await client.getSigningKey(decoded.header.kid);
  return key.getPublicKey()
}

export const verifyJwt = async (
  token: string, 
  issuer: string,
  audience: [string, string],
  algorithm: Algorithm,
  cacheMaxAge: number,
): Promise<string | JwtPayload> => {
  const decoded = jwt.decode(token, { complete: true });
  const client = getClient(issuer, { cacheMaxAge: cacheMaxAge });
  const key = await getKey(client, decoded);
  return jwt.verify(
    token,
    key,
    {
      issuer: issuer,
      audience: audience,
      algorithms: [algorithm]
    }
  );
}
