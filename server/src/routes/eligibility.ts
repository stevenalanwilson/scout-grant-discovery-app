import { Router } from 'express';
import { eligibilityController } from '../controllers/eligibilityController';

const router = Router({ mergeParams: true });

router.get('/', eligibilityController.get);
router.post('/', eligibilityController.assess);

export default router;
