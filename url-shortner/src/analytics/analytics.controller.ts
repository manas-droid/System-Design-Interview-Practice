import {Request, Response} from 'express';
import { ClickAnalyticsService, IClickAnalyticsService } from './analytics.service';
import { SqliteUrlRepository } from '../urls/url.repository';
import { AnalyticsRepository } from './analytics.repository';




const analyticsService:IClickAnalyticsService  = new ClickAnalyticsService( new SqliteUrlRepository(), new AnalyticsRepository());


export async function getAnalyticsByShortCode(req : Request, res:Response) {
    const shortCode: string = req.params.shortCode; 
    try {
        const analyticsData = await analyticsService.getClickAnalyticsPerURL(shortCode);
        res.status(200).json(analyticsData);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
}