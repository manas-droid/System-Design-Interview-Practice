import { db } from '../database/database';
import { UrlRecord } from './url.model';



export interface IUrlRepository {
    create(shortCode: string, originalUrl: string): Promise<void>;
    getAll(): Promise<UrlRecord[]>;
    processClickTransaction(shortCode: string, userAgent: string): Promise<string>;
}

export class SqliteUrlRepository implements IUrlRepository {
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
  
  checkIfShortCodeExists(shortCode: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get('SELECT 1 FROM url_clicks WHERE short_code = ?', [shortCode], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });

    })
  }
  getAll(): Promise<UrlRecord[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM url_clicks ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as UrlRecord[]);
      });
    });
  }

  processClickTransaction(shortCode: string, userAgent?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.get('SELECT original_url FROM url_clicks WHERE short_code = ?', [shortCode], (err, row) => {
          if (err || !row) {
            db.run('ROLLBACK');
            reject(err || new Error('Short code not found'));
            return;
          }
          
          const originalUrl = (row as any).original_url;
          
          db.run('UPDATE url_clicks SET click_count = click_count + 1 WHERE short_code = ?', [shortCode], (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            db.run('INSERT INTO click_analytics (short_code, user_agent) VALUES (?, ?)', [shortCode, userAgent || null], (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              db.run('COMMIT');
              resolve(originalUrl);
            });
          });
        });
      });
    });
  }

}
