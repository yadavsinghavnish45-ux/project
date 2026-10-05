import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { encrypt, decrypt, encryptString, decryptString, float32ArrayToBase64, base64ToFloat32Array } from '../src/utils/encryption.js';

describe('Encryption utilities', () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  const testKey = '717372ace6eef98afe0b28495a401de24f9cd913f1a9f93181299db24547c909';

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = testKey;
    // Re-import to pick up new env var
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it('should encrypt and decrypt buffer correctly', () => {
    const data = Buffer.from('test data to encrypt');
    const encrypted = encrypt(data);
    const decrypted = decrypt(encrypted);
    expect(decrypted.equals(data)).toBe(true);
  });

  it('should encrypt and decrypt string correctly', () => {
    const data = 'test string data';
    const encrypted = encryptString(data);
    const decrypted = decryptString(encrypted);
    expect(decrypted).toBe(data);
  });

  it('should handle Float32Array to base64 conversion', () => {
    const arr = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
    const base64 = float32ArrayToBase64(arr);
    const restored = base64ToFloat32Array(base64);
    
    expect(restored.length).toBe(arr.length);
    for (let i = 0; i < arr.length; i++) {
      expect(restored[i]).toBeCloseTo(arr[i], 5);
    }
  });

  it('should produce different ciphertext for same input', () => {
    const data = Buffer.from('same input');
    const encrypted1 = encrypt(data);
    const encrypted2 = encrypt(data);
    expect(encrypted1.equals(encrypted2)).toBe(false);
  });

  it('should handle empty buffer', () => {
    const data = Buffer.from('');
    const encrypted = encrypt(data);
    const decrypted = decrypt(encrypted);
    expect(decrypted.equals(data)).toBe(true);
  });
});