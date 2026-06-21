import { z } from "zod";

/**
 * Canonicalize an email address to prevent duplicate accounts.
 * Handles Gmail dot-stripping, plus-tag removal, and case normalization.
 *
 * Examples:
 * - Jane.Doe+test@gmail.com -> janedoe@gmail.com
 * - John+work@outlook.com -> john@outlook.com
 * - MARY@YAHOO.COM -> mary@yahoo.com
 */
export function canonicalizeEmail(email: string): string {
  const [localPart, domain] = email.toLowerCase().trim().split("@");
  if (!localPart || !domain) return email.toLowerCase().trim();

  if (domain === "gmail.com" || domain === "googlemail.com") {
    const cleaned = localPart.split("+")[0].replace(/\./g, "");
    return `${cleaned}@gmail.com`;
  }

  if (["outlook.com", "hotmail.com", "live.com"].includes(domain)) {
    const cleaned = localPart.split("+")[0];
    return `${cleaned}@${domain}`;
  }

  if (domain === "yahoo.com" || domain === "ymail.com") {
    const cleaned = localPart.split("+")[0];
    return `${cleaned}@${domain}`;
  }

  const cleaned = localPart.split("+")[0];
  return `${cleaned}@${domain}`;
}

/**
 * Zod schema that validates and canonicalizes an email address.
 */
export const emailSchema = z
  .string()
  .email()
  .transform((email) => canonicalizeEmail(email));
