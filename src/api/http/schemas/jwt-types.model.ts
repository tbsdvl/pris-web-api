'use strict';

import { Jwt, JwtPayload } from "jsonwebtoken";

export interface AzureAdJwtPayload extends JwtPayload {
  tid: string;
  ver?: string;
  acr?: string;
  aio?: string;
  amr?: string[];
  appid?: string;
  appidacr?: string;
  idp?: string;
  ipaddr?: string;
  name?: string;
  oid?: string;
  platf?: string;
  puid?: string;
  scp?: string;
  signin_state?: string[];
  unique_name?: string;
  upn?: string;
  uti?: string;
  rh?: string;
  email?: string;
  preferred_username?: string;
  roles?: string[];
}

export interface AzureAdJwt extends Jwt {
  payload: AzureAdJwtPayload;
}

export interface AuthenticatedUser {
  tid: string;
  sub: string;
  token: string;
  iss: string;
  aud: string | string[];
  name?: string;
  email?: string;
  roles?: string[];
  oid?: string;
  upn?: string;
}