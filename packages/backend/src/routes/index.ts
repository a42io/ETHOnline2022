import * as express from 'express';
import { nonce, signin } from '~/controllers/auth';
import { ethAuth, accessTokenAuth } from '~/middlewares/auth';
import {
    list as getEvents,
    get as getEvent,
    update as updateEvent,
    create as createEvent,
    my,
} from '~/controllers/events';

import {
    list as getTickets,
    get as getTicket,
    issue as issueTicket,
    verify as verifyTicket,
    invalidate as invalidateTicket,
} from '~/controllers/tickets';

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
 * Public API
 */
// events and ticket info
router.get('/events', getEvents);
router.get('/event/:eventId', getEvent);
router.get('/tickets/:ticketId', getTicket);

/**
 * Events
 */
router.get('/my', accessTokenAuth, my); // as admin or manager
router.post('/events', accessTokenAuth, createEvent);
router.put('/event/:eventId', accessTokenAuth, updateEvent);

/**
 * Tickets
 */
router.get('/tickets', accessTokenAuth, getTickets);
router.post('/tickets', ethAuth, issueTicket);
router.post('/tickets/:ticketId', ethAuth, invalidateTicket);

/**
 * Verification
 */
router.post('/verify', accessTokenAuth, verifyTicket);

export default router;
