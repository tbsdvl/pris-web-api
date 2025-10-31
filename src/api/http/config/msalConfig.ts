import { ConfidentialClientApplication } from "@azure/msal-node";
import dotenv from 'dotenv';
dotenv.config();

export function createCCAForTenant(tenantId: string): ConfidentialClientApplication {
  return new ConfidentialClientApplication({
    auth: {
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  });
}

export const cca = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID || 'common'}`,
  },
});
