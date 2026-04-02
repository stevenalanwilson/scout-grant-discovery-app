import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import router from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { startScheduler } from './services/schedulerService';

const app = express();
const port = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router);

// SPA fallback — serve index.html for any non-API route so React Router works
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startScheduler();
});
