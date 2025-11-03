import { IUrlRepository } from "../urls/url.repository";
import { ClickAnalyticsResponse } from "./analytics.model";
import { IAnalyticsRepository } from "./analytics.repository";


export interface IClickAnalyticsService {
    getClickAnalyticsPerURL(shortCode: string): Promise<any>;
}



export class ClickAnalyticsService implements IClickAnalyticsService {
    private readonly urlRepo: IUrlRepository;
    private readonly analyticsRepo: IAnalyticsRepository;

    constructor(urlRepo: IUrlRepository, analyticsRepo: IAnalyticsRepository) {
        this.urlRepo = urlRepo;
        this.analyticsRepo = analyticsRepo;
    }


    async getClickAnalyticsPerURL(shortCode: string): Promise<ClickAnalyticsResponse> {
        const clickCount: number = await this.urlRepo.getClickCountByShortCode(shortCode);
        if (clickCount > 0) {
            const analytics = await this.analyticsRepo.getAnalyticsByShortCode(shortCode);
            return { short_code: shortCode, total_clicks: clickCount, analytics: analytics?.analytics || [] };
        }   

        return {short_code: shortCode, total_clicks: 0, analytics: [] };
    }  

}