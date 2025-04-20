import crypto from 'crypto';

/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */

// Environment variable for the encryption key, or fallback to a default (for development only)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development-only-32c';

// Algorithm to use for encryption
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt data with AES-256-GCM
 * @param data The data to encrypt (string or object)
 * @returns The encrypted data with IV and auth tag
 */
export function encrypt(data: string | object): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  // Convert object to string if needed
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Generate random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher with key and IV
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  // Encrypt the data
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the authentication tag
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * @param encrypted The encrypted data
 * @param iv The initialization vector used for encryption
 * @param tag The authentication tag
 * @param asObject Whether to parse the decrypted result as JSON
 * @returns The decrypted data
 */
export function decrypt<T = string>(
  encrypted: string,
  iv: string,
  tag: string,
  asObject: boolean = false
): T {
  // Create decipher with key and IV
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );
  
  // Set auth tag
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  // Decrypt the data
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  // Parse as object if requested
  if (asObject) {
    return JSON.parse(decrypted) as T;
  }
  
  return decrypted as unknown as T;
}

/**
 * Create a secure hash of data (e.g., for comparison without storing plaintext)
 * @param data The data to hash
 * @returns The hashed data
 */
export function hash(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate a random secure token (e.g., for API keys)
 * @param length Length of the token to generate
 * @returns Random secure token
 */
export function generateToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('hex');
} 