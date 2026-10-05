import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateToken, verifyToken, generateVoterToken, generateAdminToken } from '../src/utils/jwt.js';

describe('JWT utilities', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpires = process.env.JWT_EXPIRES_IN;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only-min-32-chars';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_EXPIRES_IN = originalExpires;
  });

  it('should generate and verify voter token', () => {
    const payload = { userId: 'user123', username: 'testuser', role: 'voter' as const };
    const token = generateToken(payload);
    const verified = verifyToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.username).toBe(payload.username);
    expect(verified?.role).toBe(payload.role);
  });

  it('should generate and verify admin token', () => {
    const payload = { userId: 'admin123', username: 'admin', role: 'admin' as const };
    const token = generateToken(payload);
    const verified = verifyToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe('admin');
  });

  it('should return null for invalid token', () => {
    const verified = verifyToken('invalid.token.here');
    expect(verified).toBeNull();
  });

  it('should return null for tampered token', () => {
    const payload = { userId: 'user123', username: 'testuser', role: 'voter' as const };
    const token = generateToken(payload);
    const tampered = token + 'tampered';
    const verified = verifyToken(tampered);
    expect(verified).toBeNull();
  });

  it('should generate voter token with helper', () => {
    const user = { id: 'user123', username: 'testuser', email: 'test@example.com', fullName: 'Test', emailVerified: true, hasVoted: false, createdAt: new Date() };
    const token = generateVoterToken(user);
    const verified = verifyToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(user.id);
    expect(verified?.role).toBe('voter');
  });

  it('should generate admin token with helper', () => {
    const token = generateAdminToken('admin123', 'admin');
    const verified = verifyToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('admin123');
    expect(verified?.role).toBe('admin');
  });
});