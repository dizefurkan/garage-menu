import { timingSafeEqual } from "node:crypto";

export type BasicAuthCredentials = {
  username: string;
  password: string;
};

export type BasicAuthValidationResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "misconfigured" };

export function getAdminCredentials(): BasicAuthCredentials | null {
  const username = process.env.ADMIN_USER?.trim();
  const password = process.env.ADMIN_PASS?.trim();

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

export function parseBasicAuthHeader(
  authorizationHeader: string | null
): BasicAuthCredentials | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, encodedValue] = authorizationHeader.split(" ");

  if (scheme !== "Basic" || !encodedValue) {
    return null;
  }

  try {
    const decodedValue = Buffer.from(encodedValue, "base64").toString("utf8");
    const separatorIndex = decodedValue.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decodedValue.slice(0, separatorIndex),
      password: decodedValue.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function validateAdminAuthorizationHeader(
  authorizationHeader: string | null
): BasicAuthValidationResult {
  const configuredCredentials = getAdminCredentials();

  if (!configuredCredentials) {
    return { ok: false, reason: "misconfigured" };
  }

  const providedCredentials = parseBasicAuthHeader(authorizationHeader);

  if (!providedCredentials) {
    return { ok: false, reason: "missing" };
  }

  const isUsernameValid = secureCompare(
    providedCredentials.username,
    configuredCredentials.username
  );
  const isPasswordValid = secureCompare(
    providedCredentials.password,
    configuredCredentials.password
  );

  if (!isUsernameValid || !isPasswordValid) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true };
}
