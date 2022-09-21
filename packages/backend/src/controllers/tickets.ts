import express from 'express';
import { DateTime } from 'luxon';
import {
    notFoundException,
    unknownException,
} from '~/middlewares/ErrorHandler';

import { EVENT_API_ERRORS, UNKNOWN_ERROR } from '~/entities/error';
import { Condition, OrderBy } from '~/entities/query';
import {
    getTicket,
    getAccountTickets,
    createTicket,
    setVerifiedTicket,
    getAccountTicket,
    invalidateTicket,
} from '~/repositories/ticket';
import { getEvent } from '~/repositories/event';
import { isAllowListIncluded, isOwner, lookupAddress } from '~/libs/nft';
import { createTicketingLog } from '~/repositories/ticketingLog';
import { ENSTicket, NFTTicket } from '~/entities/ticket';
import {
    generateStatusId,
    getTokenStatus,
    incrementUsageCount,
} from '~/repositories/eventTokenStatus';
import { TokenType } from '~/entities/nft';
import { createVerificationLog } from '~/repositories/verificationLog';
import { isToday } from '~/libs/dateUti';
import { AllowListENS, AllowListNFT } from '~/entities/event';
import { mainnetProvider } from '~/libs/web3providers';

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
    const { eventId, nft, ens, nonce } = message;
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
        const event = await getEvent(eventId);
        if (!event) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }

        //todo 終わったイベントじゃないか
        if (DateTime.fromJSDate(event.endAt as Date) < DateTime.now()) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }
        //todo すでに issue 済みで invalidate していないチケットがないかどうか
        const accountTickets = await getAccountTickets(account.id, [
            { target: 'event_id', operator: '==', value: event.id },
        ]);
        if (
            accountTickets &&
            accountTickets?.length !== 0 &&
            accountTickets.some((r) => !r.invalidated)
        ) {
            // todo issue 済みで invalidate していないチケットが存在する
            return next(notFoundException(UNKNOWN_ERROR));
        }

        if (nft) {
            const { isIncluded } = isAllowListIncluded(nft, event.allowList);
            if (!isIncluded) {
                // todo
                return res.status(400).json({ message: 'INVALID_NFT' });
            }
            const isTokenOwner = await isOwner(
                account.id,
                nft.chainId,
                nft.contractAddress,
                nft.tokenId
            );
            if (!isTokenOwner) {
                // todo
                return res.status(400).json({ message: 'NOT_TOKEN_OWNER' });
            }
        } else if (ens) {
            const { isIncluded } = isAllowListIncluded(
                { tokenType: 'ENS', ens },
                event.allowList
            );
            if (!isIncluded) {
                // todo
                return res.status(400).json({ message: 'INVALID_ENS' });
            }
            const addressInfo = await lookupAddress(ens);
            if (addressInfo.address !== account.id) {
                // todo
                return res.status(400).json({ message: 'NOT_ENS_OWNER' });
            }
        }

        // ticket 生成
        let ticket;
        if (ens) {
            ticket = await createTicket(event.id, {
                nonce,
                account: account.id,
                eventId: event.id,
                invalidated: false,
                ens: ens as string,
                signature,
            } as ENSTicket);
        } else {
            ticket = await createTicket(event.id, {
                nonce,
                account: account.id,
                eventId: event.id,
                invalidated: false,
                nft,
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

export const verify: express.RequestHandler = async (req, res, next) => {
    const { message, signature, ticketId } = req.body;
    const { eventId, nft, ens, nonce } = message;

    const manager = req.context.account;

    if (!signature) {
        // todo
        return res.status(400).json({ message: 'INVALID_PARAMS' });
    }

    if (!isValidMessage(message)) {
        // todo
        return res.status(400).json({ message: 'INVALID_JSON' });
    }

    try {
        const event = await getEvent(eventId);
        if (!event) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }

        // 自分がもぎりできるイベントか
        const ensName = await mainnetProvider.lookupAddress(manager.id);
        if (
            event.host.addressOrEns !== ensName &&
            event.host.addressOrEns !== manager.id &&
            !event.managers.some((r) => r.address === manager.id)
        ) {
            // todo
            return next(EVENT_API_ERRORS.INVALID_ACCESS_TOKEN);
        }

        //todo 終わったイベントじゃないか
        if (DateTime.fromJSDate(event.endAt as Date) < DateTime.now()) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }

        const ticket = await getTicket(ticketId);
        if (!ticket) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }
        if (ticket.invalidated) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }
        if (ticket.verifiedAt) {
            if (isToday(event.timezone, ticket.verifiedAt as Date)) {
                // todo もぎり済み
                return next(notFoundException(UNKNOWN_ERROR));
            }
        }

        if (ticket.signature !== signature) {
            // todo signature が違った場合
            return next(notFoundException(UNKNOWN_ERROR));
        }
        if (ticket.nonce !== nonce) {
            // todo nonce が違った場合
            return next(notFoundException(UNKNOWN_ERROR));
        }

        if (ens && (ticket as ENSTicket).ens !== ens) {
            // todo ens が一致しない場合
            return next(notFoundException(UNKNOWN_ERROR));
        }

        if (nft && (ticket as NFTTicket).nft) {
            const ticketNFT = (ticket as NFTTicket).nft;
            if (
                ticketNFT.chainId !== nft.chainId ||
                ticketNFT.tokenType !== nft.tokenType ||
                ticketNFT.contractAddress !== nft.contractAddress ||
                (ticketNFT.tokenId && ticketNFT.tokenId !== nft.tokenId)
            ) {
                // todo nft が一致しない場合
                return next(notFoundException(UNKNOWN_ERROR));
            }
        }

        const tokenType: TokenType = ens
            ? ('ENS' as TokenType)
            : (nft.tokenType as TokenType);

        const tokenStatusId = generateStatusId(ens, nft);
        let tokenStatus = await getTokenStatus(eventId, tokenStatusId);

        if (tokenStatus) {
            if (tokenType === 'ENS' || tokenType === 'ERC721') {
                // 同じ日に更新済みの場合
                if (isToday(event.timezone, tokenStatus.updatedAt as Date)) {
                    // todo
                    return next(notFoundException(UNKNOWN_ERROR));
                }
            }
        }

        if (nft) {
            const { allowListValue, isIncluded } = isAllowListIncluded(
                nft,
                event.allowList
            );
            if (!isIncluded) {
                // todo
                return res.status(400).json({ message: 'INVALID_NFT' });
            }
            const isTokenOwner = await isOwner(
                ticket.account,
                nft.chainId,
                nft.contractAddress,
                nft.tokenId
            );
            if (!isTokenOwner) {
                // todo
                return res.status(400).json({ message: 'NOT_TOKEN_OWNER' });
            }
            if (
                allowListValue &&
                (allowListValue as AllowListNFT).tokenType === 'ERC721'
            ) {
                if (
                    tokenStatus &&
                    tokenStatus.totalUsageCount <=
                        allowListValue.availableUsageCount
                ) {
                    // todo 上限こえ
                    return res.status(400).json({ message: 'NOT_TOKEN_OWNER' });
                }
            }
        } else if (ens) {
            const { allowListValue, isIncluded } = isAllowListIncluded(
                { tokenType: 'ENS', ens },
                event.allowList
            );
            if (!isIncluded) {
                // todo
                return res.status(400).json({ message: 'INVALID_ENS' });
            }
            const addressInfo = await lookupAddress(ens);
            if (addressInfo.address !== ticket.account) {
                // todo
                return res.status(400).json({ message: 'NOT_ENS_OWNER' });
            }
            if (
                allowListValue &&
                (allowListValue as AllowListENS).tokenType === 'ENS'
            ) {
                if (
                    tokenStatus &&
                    tokenStatus.totalUsageCount <=
                        allowListValue.availableUsageCount
                ) {
                    // todo 上限こえ
                    return res.status(400).json({ message: 'NOT_TOKEN_OWNER' });
                }
            }
        }

        // tokenStatus の更新
        if (!tokenStatus) {
            tokenStatus = await incrementUsageCount(
                eventId,
                tokenStatusId,
                tokenType
            );
        }

        // ticket の verified_at を更新
        await setVerifiedTicket(ticket.account, ticketId);

        // verification log 生成
        await createVerificationLog(event.id, {
            account: ticket.account,
            ticketId,
            ens: (ticket as ENSTicket)?.ens,
            nft: (ticket as NFTTicket)?.nft,
            totalUsageCount: tokenStatus!.totalUsageCount,
        });

        return res.json(ticket);
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};

export const invalidate: express.RequestHandler = async (req, res, next) => {
    const { message, signature, currentTicketId } = req.body;
    const { eventId, nft, ens, nonce } = message;

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
        const event = await getEvent(eventId);
        if (!event) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }

        //todo 終わったイベントじゃないか
        if (DateTime.fromJSDate(event.endAt as Date) < DateTime.now()) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }
        //todo 指定されたチケット存在しない、もしくは invalidated 済みじゃないか
        const currentTicket = await getAccountTicket(
            account.id,
            currentTicketId
        );
        if (!currentTicket || currentTicket.invalidated) {
            // todo
            return next(notFoundException(UNKNOWN_ERROR));
        }

        if (nft) {
            const { isIncluded } = isAllowListIncluded(nft, event.allowList);
            if (!isIncluded) {
                // todo
                return res.status(400).json({ message: 'INVALID_NFT' });
            }
            const isTokenOwner = await isOwner(
                account.id,
                nft.chainId,
                nft.contractAddress,
                nft.tokenId
            );
            if (!isTokenOwner) {
                // todo
                return res.status(400).json({ message: 'NOT_TOKEN_OWNER' });
            }
        } else if (ens) {
            const { isIncluded } = isAllowListIncluded(
                { tokenType: 'ENS', ens },
                event.allowList
            );
            if (!isIncluded) {
                // todo
                return res.status(400).json({ message: 'INVALID_ENS' });
            }
            const addressInfo = await lookupAddress(ens);
            if (addressInfo.address !== account.id) {
                // todo
                return res.status(400).json({ message: 'NOT_ENS_OWNER' });
            }
        }

        // ticket 生成
        let ticket;
        if (ens) {
            ticket = await invalidateTicket(account.id, event.id, {
                nonce,
                account: account.id,
                eventId: event.id,
                invalidated: false,
                ens,
                signature,
            } as ENSTicket);
        } else {
            ticket = await invalidateTicket(account.id, event.id, {
                nonce,
                account: account.id,
                eventId: event.id,
                invalidated: false,
                nft,
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
