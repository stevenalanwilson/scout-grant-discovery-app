import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { eligibilityController } from '../controllers/eligibilityController';

const router = Router();

router.get('/scraping/history', adminController.getScrapeHistory);
router.get('/scraping/sources', adminController.getScrapeSourceStatus);
router.get('/eligibility/recent', eligibilityController.getRecentAdmin);
router.get('/eligibility/stats', eligibilityController.getStatsAdmin);

export default router;
