export interface IRateLimiter {
    limitRequest(userId: string): boolean;
}



interface FixedWindowCounter{
    count:number;
    windowStart:number;
}

export class FixedWindowRateLimiter implements IRateLimiter {

    private requestsMap: Map<string, FixedWindowCounter>;
    private readonly maxRequests: number = 5;
    private readonly windowSizeInMillis: number = 60 * 1000; // 1 minute    


    constructor() {
        this.requestsMap = new Map();
    }


    limitRequest(userId: string): boolean {
        if (!this.requestsMap.has(userId))
            this.requestsMap.set(userId, { count: 0, windowStart: Date.now() });

        const userCounter = this.requestsMap.get(userId)!;
        const currentTime = Date.now();

        if (currentTime - userCounter.windowStart >= this.windowSizeInMillis) {
            userCounter.count = 1;
            userCounter.windowStart = currentTime;
            return false; // Allow request
        }
        else {
        
            if (userCounter.count >= this.maxRequests) {
                return true; // Block request
            }

            else {
                userCounter.count++;
                return false; // Allow request
            }
        }

    }

}