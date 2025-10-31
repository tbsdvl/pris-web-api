'use strict';

import { OnBehalfOfRequest } from "@azure/msal-node";
import { createCCAForTenant } from "../api/http/config/msalConfig.js";

export type AdminCheckResult = {
  isAdmin: boolean;
  roles: Array<{ id: string; displayName?: string; roleTemplateId?: string }>;
  accessToken?: string; // Graph OBO token (omit returning if you prefer)
};

export const ADMIN_ROLE_TEMPLATE_IDS = new Set<string>([
  // Global Administrator
  "62e90394-69f5-4237-9190-012177145e10",
  // Application Administrator
  "9f06204d-73c1-4d4c-880a-6edb90606fd8",
  // Cloud Application Administrator
  "158c047a-c907-4556-b7ef-446551a6b5f7",
  // User Administrator
  "fe930be7-5e62-47db-91af-98c3a49a38b1",
  // Privileged Role Administrator
  "e8611ab8-c189-46e8-94e1-60213ab1f814",
]);

/**
 * Uses OBO to call Microsoft Graph and check if the caller is in any admin directory roles.
 * @param params.tid          Tenant ID extracted from the verified SPA token.
 * @param params.oboAssertion The raw SPA bearer token you verified.       A configured msal-node ConfidentialClientApplication.
 */
export async function checkIsTenantAdmin(params: {
  tid: string;
  oboAssertion: string;
}): Promise<AdminCheckResult> {
  const { tid, oboAssertion } = params;

  // 1) OBO for Graph
  const oboReq: OnBehalfOfRequest = {
    authority: `https://login.microsoftonline.com/${tid}`, // Specific tenant authority
    oboAssertion,
    scopes: ["https://graph.microsoft.com/.default"],
  };

  const cca = createCCAForTenant(tid);
  const obo = await cca.acquireTokenOnBehalfOf(oboReq);
  if (!obo?.accessToken) {
    console.error('OBO failed for tenant:', tid);
    throw new Error("OBO for Graph failed");
  }

  // 2) Query directory roles for the signed-in user
  const resp = await fetch(
    "https://graph.microsoft.com/v1.0/me/memberOf/microsoft.graph.directoryRole?$select=id,displayName,roleTemplateId",
    { headers: { Authorization: `Bearer ${obo.accessToken}` } }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Graph me/memberOf call failed: ${resp.status} ${text}`);
  }

  interface GraphDirectoryRoleResponse {
    value: Array<{
      id: string;
      displayName?: string;
      roleTemplateId?: string;
    }>;
  }
  
  const json = await resp.json() as GraphDirectoryRoleResponse;
  const roles = json?.value?.map(r => ({
    id: r.id,
    displayName: r.displayName,
    roleTemplateId: r.roleTemplateId,
  })) ?? [];

  // 3) Admin decision
  const isAdmin = roles.some(r => r.roleTemplateId && ADMIN_ROLE_TEMPLATE_IDS.has(r.roleTemplateId));

  return { isAdmin, roles /*, accessToken: obo.accessToken*/ };
}
