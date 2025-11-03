export interface ClickAnalyticsModel {
    id: number;
    short_code: string;
    clicked_at: Date;
    user_agent: string;
}



export interface ClickAnalyticsResponse{
    short_code: string;
    total_clicks: number;
    analytics: Array<{ clicked_at: Date; user_agent: string;}>;
}


