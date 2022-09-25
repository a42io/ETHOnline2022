import express from 'express';
import { DateTime } from 'luxon';
import {
    badRequestException,
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
import { isBetween, isFuture, isValidTimeZone } from '~/libs/dateUti';
import { ethers } from 'ethers';
import { supportedChainIds } from '~/entities/nft';
import {
    isValidAddress,
    isValidTokenId,
    getAccountAllowedNFTs,
} from '~/libs/nft';

export const list: express.RequestHandler = async (req, res, next) => {
    try {
        const cursor = req.query.cursor;

        const l = Number(req.query.limit);
        const limit: number = !isNaN(l) ? l : 10;

        let operator = req.query.operator;
        if (operator !== 'desc' && operator !== 'asc') operator = 'desc';

        const orderBy: OrderBy = {
            target: 'created_at',
            operator: operator as 'desc' | 'asc',
        };

        const events = await getEvents([], orderBy, cursor as string, limit);

        return res.json({ events });
    } catch (e) {
        return next(
            unknownException(EVENT_API_ERRORS.EVENT_UNKNOWN_ERROR, e as Error)
        );
    }
};

export const my: express.RequestHandler = async (req, res, next) => {
    const account = req.context.account;
    const { role } = req.query;
    try {
        const cursor = req.query.cursor;

        const l = Number(req.query.limit);
        const limit: number = !isNaN(l) ? l : 10;

        let operator = req.query.operator;
        if (operator !== 'desc' && operator !== 'asc') operator = 'desc';

        const orderBy: OrderBy = {
            target: 'created_at',
            operator: operator as 'desc' | 'asc',
        };

        const condition: Condition[] =
            role === 'admin'
                ? [
                      {
                          target: 'host.address_or_ens',
                          operator: '==',
                          value: account.id,
                      },
                  ]
                : [
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

        return res.json({ events });
    } catch (e) {
        return next(
            unknownException(EVENT_API_ERRORS.EVENT_UNKNOWN_ERROR, e as Error)
        );
    }
};

export const get: express.RequestHandler = async (req, res, next) => {
    const eventId = req.params.eventId;
    try {
        const event = await getEvent(eventId);
        if (!event) {
            return next(notFoundException(EVENT_API_ERRORS.EVENT_NOT_FOUND));
        }
        return res.json(event);
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};

export const getAllowedNFTs: express.RequestHandler = async (
    req,
    res,
    next
) => {
    const eventId = req.params.eventId;
    const account = req.context.account;
    try {
        const event = await getEvent(eventId);
        if (!event) {
            return next(notFoundException(EVENT_API_ERRORS.EVENT_NOT_FOUND));
        }

        const result = await getAccountAllowedNFTs(account.id, event.allowList);
        return res.json({ list: result });
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};

//todo a lot of validations
export const create: express.RequestHandler = async (req, res, next) => {
    const account = req.context.account;
    try {
        const event: Partial<Event> = req.body;

        if (
            event.managers &&
            event.managers.some(
                (r) => ethers.utils.getAddress(r.address) === account.id
            )
        ) {
            return next(badRequestException(EVENT_API_ERRORS.INVALID_MANAGERS));
        }

        if (
            !isFuture(
                new Date(event.endAt as Date),
                new Date(event.startAt as Date)
            )
        ) {
            return next(badRequestException(EVENT_API_ERRORS.INVALID_DATE));
        }

        if (!event.allowList || event.allowList.length === 0) {
            return next(badRequestException(EVENT_API_ERRORS.EMPTY_ALLOW_LIST));
        }

        const isValidAllowList = event.allowList.every((r) => {
            if (r.availableUsageCount <= 0) return false;
            if (r.tokenType === 'ENS') {
                if (!r.ens.endsWith('.eth')) return false;
                return true;
            }
            if (r.tokenType === 'ERC1155' || r.tokenType === 'ERC721') {
                if (!supportedChainIds.includes(r.chainId)) return false;
                if (!isValidAddress(r.contractAddress)) return false;
                if (r.tokenId && !isValidTokenId(r.tokenId)) return false;
                return true;
            }
            return false;
        });

        if (!isValidAllowList) {
            return next(
                badRequestException(EVENT_API_ERRORS.INVALID_ALLOW_LIST)
            );
        }

        if (event.timezone && isValidTimeZone(event.timezone)) {
            return next(badRequestException(EVENT_API_ERRORS.INVALID_TIMEZONE));
        }

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

        const record: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
            title: event.title || '',
            body: event.body || '',
            cover: event.cover || '',
            description: event.description || '',
            allowList: event.allowList,
            startAt: new Date(event.startAt as Date),
            endAt: new Date(event.endAt as Date),
            host: event.host,
            isCanceled: false,
            managers: event.managers || [],
            timezone: event.timezone || 'Asia/Tokyo',
        };

        const result = await createEvent(record);
        return res.json(result);
    } catch (e) {
        return next(
            unknownException(EVENT_API_ERRORS.EVENT_UNKNOWN_ERROR, e as Error)
        );
    }
};

export const update: express.RequestHandler = async (req, res, next) => {
    const account = req.context.account;
    const eventId = req.params.eventId;
    const event: Event = req.body;

    if (eventId !== event.id) {
        return next(badRequestException(EVENT_API_ERRORS.INVALID_QUERY_PARAMS));
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
            return next(
                badRequestException(EVENT_API_ERRORS.UNAUTHORIZED_ACCOUNT)
            );
        }

        // todo キャンセルだったり重要な情報はイベント x 拾前から変更不可にする
        // 開催中の変更は不可能
        if (
            isBetween(
                DateTime.now(),
                new Date(event.startAt as Date),
                new Date(event.endAt as Date)
            )
        ) {
            return next(badRequestException(EVENT_API_ERRORS.UPDATE_FORBIDDEN));
        }

        if (
            event.managers &&
            event.managers.some(
                (r) => ethers.utils.getAddress(r.address) === account.id
            )
        ) {
            return next(badRequestException(EVENT_API_ERRORS.INVALID_MANAGERS));
        }

        if (!isFuture(event.startAt as Date)) {
            return next(badRequestException(EVENT_API_ERRORS.INVALID_DATE));
        }
        if (!isFuture(event.endAt as Date, event.startAt as Date)) {
            return next(badRequestException(EVENT_API_ERRORS.INVALID_DATE));
        }

        if (!event.allowList || event.allowList.length === 0) {
            return next(badRequestException(EVENT_API_ERRORS.EMPTY_ALLOW_LIST));
        }

        const isValidAllowList = event.allowList.every((r) => {
            if (r.availableUsageCount <= 0) return false;
            if (r.tokenType === 'ENS' && !r.ens.endsWith('.eth')) return false;
            if (r.tokenType === 'ERC1155' || r.tokenType === 'ERC721') {
                if (!supportedChainIds.includes(r.chainId)) return false;
                if (!isValidAddress(r.contractAddress)) return false;
                if (r.tokenId && !isValidTokenId(r.tokenId)) return false;
                return true;
            }
            return false;
        });

        if (!isValidAllowList) {
            return next(
                badRequestException(EVENT_API_ERRORS.INVALID_ALLOW_LIST)
            );
        }

        if (!event.timezone || isValidTimeZone(event.timezone)) {
            return next(badRequestException(EVENT_API_ERRORS.INVALID_TIMEZONE));
        }

        // todo date casting
        const record: Event = {
            id: event.id,
            title: event.title || '',
            body: event.body || '',
            cover: event.cover || '',
            description: event.description || '',
            allowList: event.allowList,
            startAt: event.startAt as Date,
            endAt: event.endAt as Date,
            host: event.host,
            isCanceled: event.isCanceled,
            managers: event.managers || [],
            timezone: event.timezone,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
            canceledAt: event.canceledAt,
        };

        await setEvent(record);
        return res.json({ message: 'ok' });
    } catch (e) {
        return next(
            unknownException(EVENT_API_ERRORS.EVENT_UNKNOWN_ERROR, e as Error)
        );
    }
};
