// Server-only helpers for username-based auth.
// Internal mapping: each username maps to a non-routable synthetic address
// `<lowercase-username>@members.avk.internal`. It is never shown to users,
// never returned to the browser, and cannot receive mail.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const INTERNAL_DOMAIN = "members.avk.internal";

export function internalEmail(username: string) {
  return `${username.trim().toLowerCase()}@${INTERNAL_DOMAIN}`;
}

export function publicServerClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export function validateStrongPassword(pw: string): string | null {
  if (pw.length < 10) return "குறைந்தது 10 எழுத்துகள் தேவை (At least 10 characters)";
  if (!/[A-Z]/.test(pw)) return "ஒரு பெரிய எழுத்து தேவை (Needs an uppercase letter)";
  if (!/[a-z]/.test(pw)) return "ஒரு சிறிய எழுத்து தேவை (Needs a lowercase letter)";
  if (!/[0-9]/.test(pw)) return "ஒரு எண் தேவை (Needs a number)";
  if (!/[^A-Za-z0-9]/.test(pw)) return "ஒரு சிறப்பு குறியீடு தேவை (Needs a symbol)";
  return null;
}

export const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_]{2,29}$/;
