export interface Database{
    initializeDatabase(): Promise<void>;
    closeDatabase(): Promise<void>;
}