'use strict';

export interface Payload {
  error: string;
  details: string;
  success: boolean;
  data: unknown;
}