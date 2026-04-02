import { Router } from 'express';
import { grantsController } from '../controllers/grantsController';

const router = Router();

router.get('/', grantsController.list);
router.get('/:id', grantsController.getOne);

export default router;
