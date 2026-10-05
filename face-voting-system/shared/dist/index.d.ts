export interface User {
    id: string;
    fullName: string;
    username: string;
    email: string;
    emailVerified: boolean;
    hasVoted: boolean;
    createdAt: Date;
    faceEmbeddingEnc?: string;
}
export interface Party {
    id: string;
    name: string;
    logoPath: string | null;
    isActive: boolean;
    createdAt: Date;
}
export interface Vote {
    id: string;
    partyId: string;
    castAt: Date;
}
export interface VoteReceipt {
    userId: string;
    castAt: Date;
}
export interface Admin {
    id: string;
    username: string;
    createdAt: Date;
}
export interface VerificationSession {
    id: string;
    userId: string;
    partyId: string;
    challenges: LivenessChallenge[];
    status: 'pending' | 'completed' | 'failed' | 'expired';
    attempts: number;
    tokenHash: string | null;
    expiresAt: Date;
}
export type LivenessChallengeType = 'blink' | 'turn_left' | 'turn_right' | 'nod' | 'smile';
export interface LivenessChallenge {
    type: LivenessChallengeType;
    instruction: string;
    completed: boolean;
}
export interface AuthResponse {
    user: User;
    token: string;
}
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}
export interface PartyWithVotes extends Party {
    voteCount: number;
}
export interface VerificationSessionResponse {
    sessionId: string;
    challenges: LivenessChallenge[];
    expiresAt: Date;
}
export interface CompleteVerificationResponse {
    token: string;
}
export { registerSchema, loginSchema, verifyEmailSchema, adminLoginSchema, partySchema, createVoteSessionSchema, completeVerificationSchema, voteSchema, type RegisterRequest, type LoginRequest, type AdminLoginRequest, type PartyRequest, type CreateVoteSessionRequest, type CompleteVerificationRequest, type VoteRequest, } from './validation.js';
//# sourceMappingURL=index.d.ts.map