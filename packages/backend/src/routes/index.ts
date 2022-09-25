import * as express from 'express';
import { nonce, signin } from '~/controllers/auth';
import { ethAuth, accessTokenAuth } from '~/middlewares/auth';
import {
    list as getEvents,
    get as getEvent,
    update as updateEvent,
    create as createEvent,
    my,
    getAllowedNFTs,
} from '~/controllers/events';

import {
    list as getTickets,
    get as getTicket,
    issue as issueTicket,
    verify as verifyTicket,
    invalidate as invalidateTicket, deleteTicket
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
router.get('/events/:eventId', getEvent);
router.get('/proofs/:proofId', getTicket);

router.get('/events/:eventId/allowedNFTs', accessTokenAuth, getAllowedNFTs);

/**
 * Events
 */
router.get('/my', accessTokenAuth, my); // as admin or manager
router.post('/events', accessTokenAuth, createEvent);
router.put('/event/:eventId', accessTokenAuth, updateEvent);

/**
 * Proofs
 */
router.get('/proofs', accessTokenAuth, getTickets);
router.post('/proofs', ethAuth, issueTicket);
router.post('/proofs/:proofId', ethAuth, invalidateTicket);
router.delete('/proofs/:proofId', accessTokenAuth, deleteTicket);

/**
 * Verification
 */
router.post('/verify', accessTokenAuth, verifyTicket);

export default router;
