import { z } from 'zod';
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    fullName: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}, {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}>, {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}, {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}>;
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const adminLoginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export declare const partySchema: z.ZodObject<{
    name: z.ZodString;
    logoPath: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    logoPath?: string | null | undefined;
}, {
    name: string;
    logoPath?: string | null | undefined;
}>;
export declare const createVoteSessionSchema: z.ZodObject<{
    partyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    partyId: string;
}, {
    partyId: string;
}>;
export declare const completeVerificationSchema: z.ZodObject<{
    matchScore: z.ZodNumber;
    challengesPassed: z.ZodArray<z.ZodEnum<["blink", "turn_left", "turn_right", "nod", "smile"]>, "many">;
}, "strip", z.ZodTypeAny, {
    matchScore: number;
    challengesPassed: ("blink" | "turn_left" | "turn_right" | "nod" | "smile")[];
}, {
    matchScore: number;
    challengesPassed: ("blink" | "turn_left" | "turn_right" | "nod" | "smile")[];
}>;
export declare const voteSchema: z.ZodObject<{
    sessionToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionToken: string;
}, {
    sessionToken: string;
}>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
export type PartyRequest = z.infer<typeof partySchema>;
export type CreateVoteSessionRequest = z.infer<typeof createVoteSessionSchema>;
export type CompleteVerificationRequest = z.infer<typeof completeVerificationSchema>;
export type VoteRequest = z.infer<typeof voteSchema>;
//# sourceMappingURL=validation.d.ts.map