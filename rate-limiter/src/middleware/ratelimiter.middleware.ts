import { NextFunction, Request, Response } from "express";
import {IRateLimiter, FixedWindowRateLimiter} from "../services/rate-limiter/fixed.window.rate.limiter"


const rateLimiter: IRateLimiter = new FixedWindowRateLimiter();


export const rateLimiterMiddleware = (req: Request, res: Response, next:NextFunction) => {

    const userId = req.ip as string;

    const isRateLimited = rateLimiter.limitRequest(userId);

    if (isRateLimited) {
        res.status(429).send('Too Many Requests');
    } else {
        next();
    }
}