import { nanoid } from "nanoid";

/**
 * Opaque token identifying a (Survey, RestaurantBranch) pair — doubles as the
 * QR-code payload, the copyable public link slug (`/r/:token`), and the
 * WhatsApp/SMS share text. Regenerating a link calls this again and
 * overwrites the stored token rather than creating a new row.
 */
export function generateLinkToken(): string {
  return nanoid(12);
}
