import express from 'express';
import urlRouter from './urls/urls.route';
import { SqliteDB } from './database/database';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", urlRouter);
app.use(errorHandler);


const sqliteDB = new SqliteDB();


sqliteDB.initializeDatabase()
  .then(() => {
    app.listen(PORT, () => { console.log(`Server is running on http://localhost:${PORT}`); });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });