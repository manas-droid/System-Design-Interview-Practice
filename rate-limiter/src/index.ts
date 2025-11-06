import express from 'express';
import proxy from './services/proxy';
import routes from './config/routes.json';
import { rateLimiterMiddleware } from './middleware/ratelimiter.middleware';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(rateLimiterMiddleware);

Object.entries(routes.services).forEach(([path, target]) => {
  app.use(path, (req, res) => { proxy(req, res, target);});
})


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});