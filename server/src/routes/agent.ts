import { Router } from 'express';
import { agentController } from '../controllers/agentController';

const router = Router();

router.get('/status', agentController.getStatus);
router.post('/run', agentController.triggerRun);

export default router;
