import express from 'express';
import webHookRouter from './webhook/webhook.router'

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/webhook", webHookRouter);


app.listen(PORT, () => { console.log(`Server running on port ${PORT}`);});