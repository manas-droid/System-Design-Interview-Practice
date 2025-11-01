import sqlite3 from 'sqlite3';
import path from 'path';
import {Database} from './database.interface'

const dbPath = path.join(__dirname, '../../data/url_shortener.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});


export class SqliteDB implements Database {

  initializeDatabase(): Promise<void> { 
    return new Promise((resolve, reject) => {
        db.serialize(() => {
          // Create url_clicks table
          db.run(`
            CREATE TABLE IF NOT EXISTS url_clicks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              short_code TEXT UNIQUE NOT NULL CHECK (LENGTH(short_code) <= 7),
              original_url TEXT NOT NULL,
              click_count INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) reject(err);
          });

          // Create click_analytics table
          db.run(`
            CREATE TABLE IF NOT EXISTS click_analytics (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              short_code TEXT NOT NULL,
              clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              user_agent TEXT,
              FOREIGN KEY (short_code) REFERENCES url_clicks (short_code)
            )
          `, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
  }


  closeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });   

  }
}