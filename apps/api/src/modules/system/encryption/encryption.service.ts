import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM

/**
 * Minimal at-rest encryption for sensitive columns (vendor bank details today —
 * see supplier.service.ts). Not a general secrets framework, just what this spec
 * requirement needs: AES-256-GCM via Node's built-in crypto, no new dependency.
 * Key is derived (SHA-256) from ENCRYPTION_KEY so any-length input still yields a
 * valid 32-byte AES-256 key, matching how JWT_SECRET is used as-is elsewhere in
 * this codebase — same "one long random env value" operational model.
 */
@Injectable()
export class EncryptionService {
  private getKey(): Buffer {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) {
      throw new InternalServerErrorException('ENCRYPTION_KEY is not configured.');
    }
    return createHash('sha256').update(secret).digest();
  }

  /** Returns `${iv}:${authTag}:${ciphertext}`, each base64. */
  encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
  }

  decrypt(encoded: string): string {
    const [ivB64, authTagB64, ciphertextB64] = encoded.split(':');
    if (!ivB64 || !authTagB64 || !ciphertextB64) {
      throw new InternalServerErrorException('Malformed encrypted value.');
    }
    const key = this.getKey();
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }

  /** Last 4 characters of a plaintext value, for masked display — e.g. "****4321". */
  static maskLast4(plaintext: string): string {
    const last4 = plaintext.slice(-4);
    return `****${last4}`;
  }
}
