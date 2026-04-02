import { Router } from 'express';
import { shortlistController } from '../controllers/shortlistController';

const router = Router();

router.get('/', shortlistController.list);
router.post('/:grantId', shortlistController.add);
router.delete('/:grantId', shortlistController.remove);

export default router;
