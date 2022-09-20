import * as express from 'express';
import { nonce, signin } from '~/controllers/auth';
import { ethAuth, accessTokenAuth } from '~/middlewares/auth';
import { events, event } from '~/controllers/events';

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

/**
 * Events
 */
router.get('/events', accessTokenAuth, events);
router.get('/event/:eventId', event);

export default router;
