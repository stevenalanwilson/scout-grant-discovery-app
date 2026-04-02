import { Router } from 'express';
import profileRouter from './profile';
import agentRouter from './agent';
import grantsRouter from './grants';
import eligibilityRouter from './eligibility';
import shortlistRouter from './shortlist';

const router = Router();

router.use('/profile', profileRouter);
router.use('/agent', agentRouter);
router.use('/grants', grantsRouter);
router.use('/grants/:grantId/eligibility', eligibilityRouter);
router.use('/shortlist', shortlistRouter);

export default router;
