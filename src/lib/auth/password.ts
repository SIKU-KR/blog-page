/**
 * Password Hashing and Verification
 * Uses SHA-256 with salt via Web Crypto API
 */

/**
 * Hash a password using SHA-256 with salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = process.env.PASSWORD_SALT;
  if (!salt) {
    throw new Error('PASSWORD_SALT environment variable is not set');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against stored hash
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!storedHash) {
    throw new Error('ADMIN_PASSWORD_HASH environment variable is not set');
  }

  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

/**
 * Verify admin credentials
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const adminUsername = process.env.ADMIN_USERNAME;
  if (!adminUsername) {
    throw new Error('ADMIN_USERNAME environment variable is not set');
  }

  if (username !== adminUsername) {
    return false;
  }

  return verifyPassword(password);
}
