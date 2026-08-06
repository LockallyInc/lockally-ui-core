// Shapes mirrored from the Lockally v1 API (docs/openapi.yaml). Kept minimal —
// only what the UI components read or write.

export interface Attachment {
  filename: string;
  content_type: string;
  /** base64 of the raw bytes (≤10 MB decoded). */
  content_base64: string;
}

export interface SendMessage {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  /** Send a stored template instead of inline subject/text/html. */
  template_id?: string;
  variables?: Record<string, string>;
  /** RFC3339; schedule up to 30 days out. */
  send_at?: string;
  attachments?: Attachment[];
}

export interface SendResult {
  id: string;
  message_id: string;
  status: 'queued' | 'scheduled';
  warning?: string;
}

export interface Contact {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  department?: string;
  role?: string;
  contact_type?: 'internal' | 'external';
  status?: string;
}

export interface Template {
  id: string;
  name: string;
  subject?: string;
  html?: string;
  text?: string;
}

/**
 * A signature is client-managed local state (Lockally has no public signatures
 * endpoint). Supply your own list to <SignaturePicker>; the chosen `html` is what
 * gets inserted / appended to the message body.
 */
export interface Signature {
  id: string;
  name: string;
  html: string;
}
