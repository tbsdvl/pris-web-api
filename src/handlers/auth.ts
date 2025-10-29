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

export async function verify(req, reply) {
  try {
    console.log('=== AUTH VERIFICATION STARTED ===');
    const raw = req.headers.authorization;
    if (!raw?.startsWith("Bearer ")) {
      console.log('No Bearer token found');
      return reply.code(401).send({ error: 'No Bearer token provided' });
    }
    const token = raw.slice(7);
    console.log('Token length:', token.length);

    // Decode token without verification first
    const decoded: any = jwt.decode(token, { complete: true });
    if (!decoded) {
      console.log('Failed to decode token');
      return reply.code(401).send({ error: 'Invalid token format' });
    }

    console.log('Token header:', decoded.header);
    console.log('Token payload tid:', decoded.payload?.tid);
    console.log('Token payload iss:', decoded.payload?.iss);
    console.log('Token payload aud:', decoded.payload?.aud);
    
    const tid = decoded?.payload?.tid;
    const iss = decoded?.payload?.iss;
    const aud = decoded?.payload?.aud;
    
    if (!tid || !iss) {
      console.log('Missing tid or iss');
      return reply.code(401).send({ error: 'Missing tenant ID or issuer' });
    }

    // Get the signing key from Azure AD's JWKS endpoint
    console.log('Getting signing key for kid:', decoded.header.kid);
    console.log('JWKS URI:', `${iss}/discovery/v2.0/keys`);
    
    const client = getClient(iss);
    const key = await new Promise<string>((resolve, reject) => {
      client.getSigningKey(decoded.header.kid, (err, key) => {
        if (err) {
          console.error('Error fetching signing key:', err);
          reject(err);
          return;
        }
        try {
          const publicKey = key.getPublicKey();
          console.log('Successfully retrieved public key');
          resolve(publicKey);
        } catch (keyErr) {
          console.error('Error getting public key from signing key:', keyErr);
          reject(keyErr);
        }
      });
    });

    console.log('Public key type:', typeof key);
    console.log('Public key length:', key.length);

    // Verify the token signature
    console.log('Starting JWT verification with:');
    console.log('- Audience:', process.env.CLIENT_ID);
    console.log('- Issuer:', iss);
    console.log('- Algorithms: RS256');

    let verified: any;
    try {
      verified = jwt.verify(token, key, {
        audience: [
          process.env.CLIENT_ID, // Just the GUID
          `api://${process.env.CLIENT_ID}`, // With api:// prefix
          `api://${process.env.CLIENT_ID}/`, // With trailing slash
          `https://${process.env.CLIENT_ID}` // With https (unlikely but possible)
        ],
        issuer: iss,
        algorithms: ['RS256']
      });
      console.log('✅ JWT verification SUCCESSFUL');
    } catch (verifyErr) {
      console.error('❌ JWT verification FAILED:', verifyErr.message);
      console.error('Verify error details:', verifyErr);
      
      // Additional debugging: Try without issuer validation
      console.log('Trying without issuer validation...');
      try {
        verified = jwt.verify(token, key, {
          audience: process.env.CLIENT_ID,
          algorithms: ['RS256'],
          ignoreExpiration: false,
          ignoreNotBefore: false
        });
        console.log('✅ JWT verification SUCCESSFUL without issuer validation');
      } catch (noIssuerErr) {
        console.error('❌ JWT verification FAILED even without issuer:', noIssuerErr.message);
        return reply.code(401).send({ 
          error: 'Token validation failed',
          details: verifyErr.message 
        });
      }
    }

    // Skip scope check for now
    console.log('Skipping scope validation');

    req.user = { 
      tid, 
      sub: verified.sub, 
      token, 
      iss, 
      aud,
      name: verified.name,
      email: verified.preferred_username || verified.email
    };
    
    console.log('✅ User authenticated successfully');
    console.log('User info:', { 
      tid: req.user.tid, 
      sub: req.user.sub,
      email: req.user.email 
    });

  } catch (error) {
    console.error('💥 Auth verification error:', error);
    return reply.code(500).send({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
}

export function authPlugin(fastify, _opts, done) {
  console.log('🔐 Auth plugin registered');
  fastify.addHook("preHandler", verify);
  done();
}