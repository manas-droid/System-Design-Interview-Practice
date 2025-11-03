import { db } from '../database/database';

export interface IAnalyticsRepository {
    getAnalyticsByShortCode(shortCode: string): Promise<{ analytics: Array<{ clicked_at: Date; user_agent: string;}>;}>;
}


export class AnalyticsRepository implements IAnalyticsRepository {

    getAnalyticsByShortCode(shortCode: string): Promise<{ analytics: Array<{ clicked_at: Date; user_agent: string; }>; }> {
        return new Promise((resolve, reject) => {
            const query = `SELECT clicked_at, user_agent FROM click_analytics WHERE short_code = ? ORDER BY clicked_at DESC`; 
            db.all(query, [shortCode], (err, rows) => {
                if (err) {
                    return reject(err);
                }   
                const analytics = rows.map(row => ({                    
                    clicked_at: new Date((row as any).clicked_at),
                    user_agent: (row as any).user_agent
                })); 
                resolve({ analytics });
            }
            )
        });

    } 

    
}