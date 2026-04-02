import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { startScheduler } from './services/schedulerService';

const app = express();
const port = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startScheduler();
});
