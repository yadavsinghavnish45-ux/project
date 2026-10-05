import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
  return Buffer.from(keyHex, 'hex');
}

export function encrypt(data: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([iv, encrypted, authTag]);
}

export function decrypt(encryptedData: Buffer): Buffer {
  const iv = encryptedData.subarray(0, IV_LENGTH);
  const authTag = encryptedData.subarray(encryptedData.length - AUTH_TAG_LENGTH);
  const encrypted = encryptedData.subarray(IV_LENGTH, encryptedData.length - AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function encryptString(text: string): string {
  return encrypt(Buffer.from(text, 'utf8')).toString('base64');
}

export function decryptString(encryptedBase64: string): string {
  return decrypt(Buffer.from(encryptedBase64, 'base64')).toString('utf8');
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64');
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Buffer.from(base64, 'base64');
}

export function float32ArrayToBase64(arr: Float32Array): string {
  return Buffer.from(arr.buffer).toString('base64');
}

export function base64ToFloat32Array(base64: string): Float32Array {
  const buffer = Buffer.from(base64, 'base64');
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
}