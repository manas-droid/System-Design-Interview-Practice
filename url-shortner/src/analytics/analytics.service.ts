

export interface IClickAnalyticsService {
    getClickAnalyticsPerURL(shortCode: string): Promise<any>;
}



export class ClickAnalyticsService implements IClickAnalyticsService {
    
    constructor() {
    }


    async getClickAnalyticsPerURL(shortCode: string): Promise<any> {
        
        return null;
    }  

}