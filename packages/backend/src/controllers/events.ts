import express from 'express';
import {
    notFoundException,
    unknownException,
} from '~/middlewares/ErrorHandler';
import { EVENT_API_ERRORS, UNKNOWN_ERROR } from '~/entities/error';
import { getEvent, getEvents } from '~/repositories/event';
import { Condition, OrderBy } from '~/entities/query';
import { Event } from '~/entities/event';

export const events: express.RequestHandler = async (req, res, next) => {
    const account = req.context.account;
    try {
        const cursor = req.query.cursor || undefined;

        const l = Number(req.query.limit);
        const limit: number = !isNaN(l) ? l : 10;

        let operator = req.query.operator;
        if (operator !== 'desc' && operator !== 'asc') operator = 'desc';

        const orderBy: OrderBy = {
            target: 'created_at',
            operator: operator as 'desc' | 'asc',
        };

        const result: { admin: Event[]; managers: Event[] } = {
            admin: [],
            managers: [],
        };
        {
            const condition: Condition[] = [
                {
                    target: 'host.address_or_ens',
                    operator: '==',
                    value: account.id,
                },
            ];

            const events = await getEvents(
                condition,
                orderBy,
                cursor as string,
                limit
            );

            if (events) {
                result.admin.push(...events);
            }
        }
        {
            const condition: Condition[] = [
                {
                    target: 'managers',
                    operator: 'array-contains-any',
                    value: [
                        { address: account.id, role: 'admin' },
                        { address: account.id, role: 'operator' },
                    ],
                },
            ];

            const events = await getEvents(
                condition,
                orderBy,
                cursor as string,
                limit
            );

            if (events && events.length !== 0) {
                result.managers.push(...events);
            }
        }

        return res.json(result);
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};

export const event: express.RequestHandler = async (req, res, next) => {
    const eventId = req.params.eventId;
    try {
        const event = await getEvent(eventId);
        if (!event) {
            return next(notFoundException(EVENT_API_ERRORS.EVENT_NOT_FOUND));
        }
        return res.json({ event });
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};
