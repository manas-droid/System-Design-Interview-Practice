export interface IRateLimiter {
    limitRequest(userId: string): boolean;
}