import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import dotenv from 'dotenv';
dotenv.config();

const jwksClients = new Map<string, ReturnType<typeof jwksClient>>();
const getClient = (iss: string) => {
  if (!jwksClients.has(iss)) {
    jwksClients.set(iss, jwksClient({
      jwksUri: `${iss}/discovery/v2.0/keys`,
      cache: true, cacheMaxAge: 10 * 60 * 1000, rateLimit: true
    }));
  }
  return jwksClients.get(iss)!;
};

async function verify(req, reply) {
  const raw = req.headers.authorization;
  if (!raw?.startsWith("Bearer ")) return reply.code(401).send();
  const token = raw.slice(7);

  const decoded: any = jwt.decode(token, { complete: true });
  const tid = decoded?.payload?.tid;
  const iss = decoded?.payload?.iss;
  if (!tid || !iss) return reply.code(401).send();

  const client = getClient(iss);
  const key = await new Promise<string>((res, rej) =>
    client.getSigningKey(decoded.header.kid, (e, k) => e ? rej(e) : res(k.getPublicKey()))
  );

  let verified: any;
  try {
    verified = jwt.verify(token, key, {
      audience: process.env.CLIENT_ID,
      issuer: `https://login.microsoftonline.com/${tid}/v2.0`,
    });
  } catch (err) {
    console.error(err);
    return reply.code(401).send();
  }

  // Fix: Check for appropriate scopes or remove scope check entirely
  const scopes = (verified.scp ?? verified.scopes ?? "").split(" ");
  if (!scopes.some(scope => 
    scope.includes("User.Read") || 
    scope.includes("Directory.Read") ||
    scope.includes("access") // Keep your existing check
  )) {
    console.log('Missing required scopes:', scopes);
    return reply.code(403).send();
  }

  req.user = { tid, sub: verified.sub, token };
}

export function authPlugin(fastify, _opts, done) {
  fastify.addHook("preHandler", verify);
  done();
}
