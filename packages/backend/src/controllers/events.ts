import express from 'express';
import { Interval, DateTime } from 'luxon';
import {
    notFoundException,
    unknownException,
} from '~/middlewares/ErrorHandler';
import { EVENT_API_ERRORS, UNKNOWN_ERROR } from '~/entities/error';
import {
    createEvent,
    getEvent,
    getEvents,
    setEvent,
} from '~/repositories/event';
import { Condition, OrderBy } from '~/entities/query';
import { Event } from '~/entities/event';
import { mainnetProvider } from '~/libs/web3providers';

export const list: express.RequestHandler = async (req, res, next) => {
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

export const get: express.RequestHandler = async (req, res, next) => {
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

//todo a lot of validations
export const create: express.RequestHandler = async (req, res, next) => {
    const account = req.context.account;
    try {
        const event: Event = req.body;

        // host setting
        const ensName = await mainnetProvider.lookupAddress(account.id);
        const resolver = ensName
            ? await mainnetProvider.getResolver(ensName)
            : null;
        const avatar = resolver ? await resolver.getAvatar() : null;
        event.host = {
            addressOrEns: ensName || account.id,
            avatarUrl: avatar?.url || '',
        };

        const record = await createEvent(event);
        return res.json(record);
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};

//todo a lot of validations
export const update: express.RequestHandler = async (req, res, next) => {
    const account = req.context.account;
    const eventId = req.params.eventId;
    const event: Event = req.body;

    if (eventId !== event.id) {
        return next('');
    }
    try {
        const ensName = await mainnetProvider.lookupAddress(account.id);
        if (
            event.host.addressOrEns !== ensName &&
            event.host.addressOrEns !== account.id &&
            !event.managers.some(
                (r) => r.address === account.id && r.role === 'admin'
            )
        ) {
            // todo
            return next(EVENT_API_ERRORS.INVALID_ACCESS_TOKEN);
        }

        // todo キャンセルだったり重要な情報はイベント x 拾前から変更不可にする
        const isBetween = Interval.fromDateTimes(
            event.startAt as Date,
            event.endAt as Date
        ).contains(DateTime.now());

        if (isBetween) {
            // todo
            return next(EVENT_API_ERRORS.INVALID_ACCESS_TOKEN);
        }

        await setEvent(event);
        return res.json({ message: 'ok' });
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};
