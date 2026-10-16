export { LockallyClient, LockallyError, fileToAttachment } from './client.js';
export { isSecretKey, resolveBaseUrl, resolveToken } from './auth.js';
export type { GetToken, LockallyAuth } from './auth.js';
export type {
  Attachment,
  SendMessage,
  SendResult,
  Contact,
  Template,
  Signature,
} from './types.js';
