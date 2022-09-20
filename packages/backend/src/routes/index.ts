import * as express from 'express';
import { nonce, signin } from '~/controllers/auth';
import { ethAuth } from '~/middlewares/auth';

const router: express.Router = express.Router();

/**
 * status check
 */
router.get('/status', (_req, res) => {
    res.json({ message: 'ok' });
});

/**
 * login
 */
router.get('/nonce', nonce);
router.post('/signin', ethAuth, signin);

export default router;
