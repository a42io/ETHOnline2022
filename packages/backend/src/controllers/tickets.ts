import express from 'express';
import {
    notFoundException,
    unknownException,
} from '~/middlewares/ErrorHandler';

import { UNKNOWN_ERROR } from '~/entities/error';
import { Condition, OrderBy } from '~/entities/query';
import {
    getTicket,
    getAccountTickets,
    createTicket,
} from '~/repositories/ticket';
import { getEvent } from '~/repositories/event';
import { isAllowListIncluded, isOwner, lookupAddress } from '~/libs/nft';
import { createTicketingLog } from '~/repositories/ticketingLog';
import { ENSTicket, NFTTicket } from '~/entities/ticket';

function isValidMessage(message: {
    eventId?: string;
    nonce?: string;
    nft?: {
        chainId: string;
        tokenType: string;
        contractAddress: string;
        tokenId?: string;
    };
    ens?: string;
}): boolean {
    return !(
        !message.eventId ||
        !message.nonce ||
        (!message.ens &&
            (!message.nft ||
                !message.nft.chainId ||
                !message.nft.tokenType ||
                message.nft.contractAddress ||
                !message.nft.tokenId))
    );
}

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

        const condition: Condition[] = [
            {
                target: 'host.address_or_ens',
                operator: '==',
                value: account.id,
            },
        ];

        const tickets = await getAccountTickets(
            account.id,
            condition,
            orderBy,
            cursor as string,
            limit
        );

        if (!tickets) {
            //todo
            return next(notFoundException(UNKNOWN_ERROR));
        }

        return res.json({ tickets });
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};

export const get: express.RequestHandler = async (req, res, next) => {
    const ticketId = req.params.ticketId;
    try {
        const ticket = await getTicket(ticketId);
        if (!ticket) {
            //todo
            return next(notFoundException(UNKNOWN_ERROR));
        }
        return res.json({
            ticket,
        });
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};

export const issue: express.RequestHandler = async (req, res, next) => {
    const { message, signature } = req.body;
    if (!signature) {
        // todo
        return res.status(400).json({ message: 'INVALID_PARAMS' });
    }
    if (!isValidMessage(message)) {
        // todo
        return res.status(400).json({ message: 'INVALID_JSON' });
    }

    const account = req.context.account;
    try {
        const event = await getEvent(message.eventId);
        if (!event) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }

        //todo 終わったイベントじゃないか
        //todo すでに issue 済みで invalidate していないチケットがないかどうか

        let included = false;
        if (message.nft) {
            included = isAllowListIncluded(message.nft, event.allowList);
            if (!included) {
                // todo
                return res.status(400).json({ message: 'INVALID_NFT' });
            }
            const isTokenOwner = await isOwner(
                account.id,
                message.nft.chainId,
                message.nft.contractAddress,
                message.nft.tokenId
            );
            if (!isTokenOwner) {
                // todo
                return res.status(400).json({ message: 'NOT_TOKEN_OWNER' });
            }
        } else if (message.ens) {
            included = isAllowListIncluded(
                { tokenType: 'ENS', ens: message.ens },
                event.allowList
            );
            if (!included) {
                // todo
                return res.status(400).json({ message: 'INVALID_ENS' });
            }
            const addressInfo = await lookupAddress(message.ens);
            if (addressInfo.address !== account.id) {
                // todo
                return res.status(400).json({ message: 'NOT_ENS_OWNER' });
            }
        }

        // ticket 生成
        let ticket;
        if (message.ens) {
            ticket = await createTicket(event.id, {
                nonce: message.nonce,
                account: account.id,
                eventId: event.id,
                invalidated: false,
                ens: message.ens as string,
                signature,
            } as ENSTicket);
        } else {
            ticket = await createTicket(event.id, {
                nonce: message.nonce,
                account: account.id,
                eventId: event.id,
                invalidated: false,
                nft: message.nft,
                signature,
            } as NFTTicket);
        }

        // ticketing log 生成
        await createTicketingLog(event.id, {
            account: account.id,
            ens: (ticket as ENSTicket)?.ens,
            nft: (ticket as NFTTicket)?.nft,
            ticketId: ticket!.id,
        });

        return res.json(ticket);
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};
