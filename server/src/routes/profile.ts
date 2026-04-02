import { Router } from 'express';
import { profileController } from '../controllers/profileController';

const router = Router();

router.get('/', profileController.get);
router.post('/', profileController.create);
router.put('/', profileController.update);

export default router;
