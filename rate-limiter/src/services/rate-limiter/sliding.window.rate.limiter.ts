import { IRateLimiter } from "./rate.limiter.interface";


interface SlidingWindowEntry {
    windowStart: number;
    currentWindowCount: number;
    previousWindowCount: number;
}


export class SlidingWindowRateLimiter implements IRateLimiter {
    
    private requestsMap: Map<string, SlidingWindowEntry>;
    private readonly maxRequests: number = 5;
    private readonly windowSizeInMillis: number = 60 * 1000; // 1 minute


    constructor() {
        this.requestsMap = new Map<string, SlidingWindowEntry>();
    }


    limitRequest(userId: string): boolean {
        const currentTime = Date.now();
        
        if (!this.requestsMap.has(userId)) {
            this.requestsMap.set(userId, {
                windowStart: currentTime,
                currentWindowCount: 0,
                previousWindowCount: 0
            });
        }
        const userEntry = this.requestsMap.get(userId)!;

        const elapsedTime = currentTime - userEntry.windowStart;


        if (elapsedTime >= this.windowSizeInMillis) {

            const windowPassed = Math.floor(elapsedTime / this.windowSizeInMillis);

            if (windowPassed === 1) {
                userEntry.previousWindowCount = userEntry.currentWindowCount;
            } else {
                userEntry.previousWindowCount = 0;
            }

            userEntry.currentWindowCount = 0;
            userEntry.windowStart = currentTime - (elapsedTime % this.windowSizeInMillis);
        }

        const weight = (this.windowSizeInMillis - (currentTime - userEntry.windowStart)) / this.windowSizeInMillis;
        const estimatedCount = userEntry.currentWindowCount + weight * userEntry.previousWindowCount;

        if (estimatedCount >= this.maxRequests) {
            return true; // Block request
        } else {
            userEntry.currentWindowCount++;
            return false; // Allow request
        }

    }


    
}