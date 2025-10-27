import { ConfidentialClientApplication } from "@azure/msal-node";
import dotenv from 'dotenv';
dotenv.config();

export const cca = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.API_CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    authority: "https://login.microsoftonline.com/organizations",
  },
});
