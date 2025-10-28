export interface UrlRecord {
  id?: number;
  short_code: string;
  original_url: string;
  click_count?: number;
  created_at?: string;
}

export interface ClickAnalytic {
  id?: number;
  short_code: string;
  clicked_at?: string;
  user_agent?: string;
}


export interface UrlModel {
    create(shortCode: string, originalUrl: string): Promise<void>;
    findByShortCode(shortCode: string): Promise<UrlRecord | null>;
    getAll(): Promise<UrlRecord[]>;
    incrementClickCount(shortCode: string): Promise<void>;
}


export interface ClickAnalyticsModel {
    create(shortCode: string, userAgent?: string): Promise<void>;
}