import { db } from './database';
import { UrlRecord, ClickAnalyticsModel, UrlModel } from './models.interface';



export class SqliteUrlModel implements UrlModel {
  create(shortCode: string, originalUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO url_clicks (short_code, original_url) VALUES (?, ?)');
      stmt.run([shortCode, originalUrl], function(err) {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });
  }

  findByShortCode(shortCode: string): Promise<UrlRecord | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM url_clicks WHERE short_code = ?', [shortCode], (err, row) => {
        if (err) reject(err);
        else resolve(row as UrlRecord || null);
      });
    });
  }

  getAll(): Promise<UrlRecord[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM url_clicks ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as UrlRecord[]);
      });
    });
  }

  incrementClickCount(shortCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('UPDATE url_clicks SET click_count = click_count + 1 WHERE short_code = ?', [shortCode], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}




export class SqliteClickAnalyticsModel implements ClickAnalyticsModel {
  create(shortCode: string, userAgent?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO click_analytics (short_code, user_agent) VALUES (?, ?)');
      stmt.run([shortCode, userAgent || null], function(err) {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });
  }
}