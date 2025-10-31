'use strict';

import Errors from '../domain/errors/index.js';

export const notFound = (name: string) => {
  return Errors.GENERAL.NOT_FOUND.replace('{0}', name);
}

export const invalid = (name: string) => {
  return Errors.GENERAL.INVALID.replace('{0}', name);
}

export const authError = (key: keyof typeof Errors.AUTH) => {
  return Errors.AUTH[key];
}

export const generalError = (key: keyof typeof Errors.GENERAL) => {
  return Errors.GENERAL[key];
}