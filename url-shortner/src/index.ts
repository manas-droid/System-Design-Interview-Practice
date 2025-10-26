import express from 'express';
import urlRouter from './urls/urls.route';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", urlRouter);


app.listen(PORT, () => { console.log(`Server is running on http://localhost:${PORT}`); });