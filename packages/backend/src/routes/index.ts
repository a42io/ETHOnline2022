import * as express from 'express';
import { nonce, signin } from '~/controllers/auth';
import { ethAuth, accessTokenAuth } from '~/middlewares/auth';
import {
    list as getEvents,
    get as getEvent,
    update as updateEvent,
    create as createEvent,
} from '~/controllers/events';

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
router.get('/events', accessTokenAuth, getEvents);
router.post('/events', accessTokenAuth, createEvent);
router.get('/event/:eventId', getEvent);
router.put('/event/:eventId', accessTokenAuth, updateEvent);

export default router;
