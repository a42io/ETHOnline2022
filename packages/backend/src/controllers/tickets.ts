import express from 'express';
import { DateTime } from 'luxon';
import {
    badRequestException,
    notFoundException,
    unknownException,
} from '~/middlewares/ErrorHandler';

import { TICKET_API_ERRORS } from '~/entities/error';
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
                !message.nft.tokenType ||
                !message.nft.chainId ||
                !message.nft.contractAddress ||
                !message.nft.tokenId))
    );
}

export const list: express.RequestHandler = async (req, res, next) => {
    const account = req.context.account;
    try {
        const cursor = req.query.cursor || undefined;
        const validated = req.query.validated || false;
        const eventId = req.query.eventId || undefined;

        const l = Number(req.query.limit);
        const limit: number = !isNaN(l) ? l : 10;

        let operator = req.query.operator;
        if (operator !== 'desc' && operator !== 'asc') operator = 'desc';

        const orderBy: OrderBy = {
            target: 'created_at',
            operator: operator as 'desc' | 'asc',
        };

        const condition: Condition[] = [];
        if (eventId) {
            condition.push({
                target: 'event_id',
                operator: '==',
                value: eventId,
            });
        }

        if (validated) {
            condition.push({
                target: 'validated',
                operator: '==',
                value: true,
            });
        }

        const proofs = await getAccountTickets(
            account.id,
            condition,
            orderBy,
            cursor as string,
            limit
        );

        return res.json({ proofs });
    } catch (e) {
        return next(
            unknownException(TICKET_API_ERRORS.TICKET_UNKNOWN_ERROR, e as Error)
        );
    }
};

export const get: express.RequestHandler = async (req, res, next) => {
    const proofId = req.params.proofId;
    try {
        const proof = await getTicket(proofId);
        if (!proof) {
            return next(notFoundException(TICKET_API_ERRORS.TICKET_NOT_FOUND));
        }
        const event = await getEvent(proof.eventId);
        if (!event) {
            return next(notFoundException(TICKET_API_ERRORS.EVENT_NOT_FOUND));
        }
        return res.json({
            ...proof,
        });
    } catch (e) {
        return next(
            unknownException(TICKET_API_ERRORS.TICKET_UNKNOWN_ERROR, e as Error)
        );
    }
};

export const issue: express.RequestHandler = async (req, res, next) => {
    const { message, signature } = req.body;
    const { eventId, nft, ens, nonce } = message;
    if (!signature) {
        return next(badRequestException(TICKET_API_ERRORS.INVALID_BODY));
    }
    if (!isValidMessage(message)) {
        return next(
            badRequestException(TICKET_API_ERRORS.INVALID_MESSAGE_JSON)
        );
    }

    const account = req.context.account;
    try {
        // check if the event exists
        const event = await getEvent(eventId);
        if (!event) {
            return next(notFoundException(TICKET_API_ERRORS.EVENT_NOT_FOUND));
        }

        // check if event is not ended
        if (DateTime.fromJSDate(event.endAt as Date) < DateTime.now()) {
            return next(
                badRequestException(TICKET_API_ERRORS.EVENT_INVALID_TERM)
            );
        }

        // check if ticket is issued and remains valid ticket
        const accountTickets = await getAccountTickets(account.id, [
            { target: 'event_id', operator: '==', value: event.id },
        ]);
        if (
            accountTickets &&
            accountTickets.length !== 0 &&
            accountTickets.some((r) => !r.invalidated)
        ) {
            return next(
                badRequestException(TICKET_API_ERRORS.VALID_TICKET_EXITS)
            );
        }

        if (nft) {
            // check if the account NFT is included in the allow list.
            const { isIncluded } = isAllowListIncluded(nft, event.allowList);
            if (!isIncluded) {
                return next(
                    badRequestException(TICKET_API_ERRORS.TOKEN_NOT_INCLUDED)
                );
            }
            const isTokenOwner = await isOwner(
                account.id,
                nft.chainId,
                nft.tokenType,
                nft.contractAddress,
                nft.tokenId
            );
            // check if the account has the token
            if (!isTokenOwner) {
                return next(
                    badRequestException(TICKET_API_ERRORS.NOT_TOKEN_OWNER)
                );
            }
        } else if (ens) {
            const { isIncluded } = isAllowListIncluded(
                { tokenType: 'ENS', ens },
                event.allowList
            );
            // check if the account's ens is included in the allow list
            if (!isIncluded) {
                return next(
                    badRequestException(TICKET_API_ERRORS.ENS_NOT_INCLUDED)
                );
            }
            // check if the account has the ens
            const addressInfo = await lookupAddress(ens);
            if (addressInfo.address !== account.id) {
                return next(
                    badRequestException(TICKET_API_ERRORS.NOT_ENS_OWNER)
                );
            }
        }

        // ticket 生成
        let ticket;
        if (ens) {
            ticket = await createTicket(account.id, {
                nonce,
                account: account.id,
                eventId: event.id,
                invalidated: false,
                ens: ens as string,
                signature,
                event: {
                    host: event.host,
                    title: event.title,
                    description: event.description,
                    cover: event.cover,
                    startAt: event.startAt,
                    endAt: event.endAt,
                },
            } as ENSTicket);
        } else {
            ticket = await createTicket(account.id, {
                nonce,
                account: account.id,
                eventId: event.id,
                invalidated: false,
                nft,
                signature,
                event: {
                    host: event.host,
                    title: event.title,
                    description: event.description,
                    cover: event.cover,
                    startAt: event.startAt,
                    endAt: event.endAt,
                },
            } as NFTTicket);
        }

        // ticketing log 生成
        await createTicketingLog(event.id, {
            account: account.id,
            ens: (ticket as ENSTicket)?.ens,
            nft: (ticket as NFTTicket)?.nft,
            ticketId: ticket.id,
        });

        return res.json(ticket);
    } catch (e) {
        return next(
            unknownException(TICKET_API_ERRORS.TICKET_UNKNOWN_ERROR, e as Error)
        );
    }
};

export const verify: express.RequestHandler = async (req, res, next) => {
    const { message, signature, proofId } = req.body;
    const { eventId, nft, ens, nonce } = message;

    const manager = req.context.account;

    if (!signature) {
        return next(badRequestException(TICKET_API_ERRORS.INVALID_BODY));
    }

    if (!isValidMessage(message)) {
        return next(
            badRequestException(TICKET_API_ERRORS.INVALID_MESSAGE_JSON)
        );
    }

    try {
        const event = await getEvent(eventId);
        // check if the event exists
        if (!event) {
            return next(badRequestException(TICKET_API_ERRORS.EVENT_NOT_FOUND));
        }

        // check if the account can manage the events
        const ensName = await mainnetProvider.lookupAddress(manager.id);
        if (
            event.host.addressOrEns !== ensName &&
            event.host.addressOrEns !== manager.id &&
            !event.managers.some((r) => r.address === manager.id)
        ) {
            return next(
                badRequestException(TICKET_API_ERRORS.UNAUTHORIZED_ACCOUNT)
            );
        }

        // check if the event already ended
        if (DateTime.fromJSDate(event.endAt as Date) < DateTime.now()) {
            return next(
                badRequestException(TICKET_API_ERRORS.EVENT_INVALID_TERM)
            );
        }

        // check if the ticket exists
        const ticket = await getTicket(proofId);
        if (!ticket) {
            return next(notFoundException(TICKET_API_ERRORS.TICKET_NOT_FOUND));
        }
        // check if the ticket is not invalidated
        if (ticket.invalidated) {
            return next(
                badRequestException(TICKET_API_ERRORS.INVALIDATED_TICKET)
            );
        }
        // check if the ticket is already used
        if (ticket.verifiedAt) {
            if (isToday(event.timezone, ticket.verifiedAt as Date)) {
                return next(
                    badRequestException(TICKET_API_ERRORS.VERIFIED_TICKET)
                );
            }
        }

        // check if the signature sent from user matches data in db.
        if (ticket.signature !== signature) {
            return next(
                badRequestException(TICKET_API_ERRORS.INVALID_SIGNATURE)
            );
        }

        // check if the nonce sent from user matches data in db.
        if (ticket.nonce !== nonce) {
            return next(badRequestException(TICKET_API_ERRORS.INVALID_NONCE));
        }

        // check if the ens sent from user matches data in db.
        if (ens && (ticket as ENSTicket).ens !== ens) {
            return next(badRequestException(TICKET_API_ERRORS.INVALID_ENS));
        }

        // check if the nft sent from user matches data in db.
        if (nft && (ticket as NFTTicket).nft) {
            const ticketNFT = (ticket as NFTTicket).nft;
            if (
                ticketNFT.chainId !== nft.chainId ||
                ticketNFT.tokenType !== nft.tokenType ||
                ticketNFT.contractAddress !== nft.contractAddress ||
                (ticketNFT.tokenId && ticketNFT.tokenId !== nft.tokenId)
            ) {
                return next(badRequestException(TICKET_API_ERRORS.INVALID_NFT));
            }
        }

        const tokenType: TokenType = ens
            ? ('ENS' as TokenType)
            : (nft.tokenType as TokenType);

        const tokenStatusId = generateStatusId(ens, nft);
        let tokenStatus = await getTokenStatus(eventId, tokenStatusId);

        if (tokenStatus) {
            if (tokenType === 'ENS' || tokenType === 'ERC721') {
                // check if the token is not used in the same day
                if (isToday(event.timezone, tokenStatus.updatedAt as Date)) {
                    return next(
                        badRequestException(TICKET_API_ERRORS.USED_TOKEN)
                    );
                }
            }
        }

        if (nft) {
            const { allowListValue, isIncluded } = isAllowListIncluded(
                nft,
                event.allowList
            );
            if (!isIncluded) {
                return next(
                    badRequestException(TICKET_API_ERRORS.TOKEN_NOT_INCLUDED)
                );
            }
            const isTokenOwner = await isOwner(
                ticket.account,
                nft.chainId,
                nft.tokenType,
                nft.contractAddress,
                nft.tokenId
            );
            if (!isTokenOwner) {
                return next(
                    badRequestException(TICKET_API_ERRORS.NOT_TOKEN_OWNER)
                );
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
                    return next(
                        badRequestException(
                            TICKET_API_ERRORS.EXCEEDED_MAXIMUM_USE_COUNT
                        )
                    );
                }
            }
        } else if (ens) {
            const { allowListValue, isIncluded } = isAllowListIncluded(
                { tokenType: 'ENS', ens },
                event.allowList
            );
            if (!isIncluded) {
                return next(
                    badRequestException(TICKET_API_ERRORS.ENS_NOT_INCLUDED)
                );
            }
            const addressInfo = await lookupAddress(ens);
            if (addressInfo.address !== ticket.account) {
                return next(
                    badRequestException(TICKET_API_ERRORS.NOT_ENS_OWNER)
                );
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
                    return next(
                        badRequestException(
                            TICKET_API_ERRORS.EXCEEDED_MAXIMUM_USE_COUNT
                        )
                    );
                }
            }
        }

        // update token status
        if (!tokenStatus) {
            tokenStatus = await incrementUsageCount(
                eventId,
                tokenStatusId,
                tokenType
            );
        }

        // update ticket verified_at
        await setVerifiedTicket(ticket.account, proofId);

        // create verification log
        await createVerificationLog(event.id, {
            account: ticket.account,
            ticketId: proofId,
            ens: (ticket as ENSTicket)?.ens,
            nft: (ticket as NFTTicket)?.nft,
            totalUsageCount: tokenStatus.totalUsageCount,
        });

        return res.json({ ...ticket, totalCount: tokenStatus.totalUsageCount });
    } catch (e) {
        return next(
            unknownException(TICKET_API_ERRORS.TICKET_UNKNOWN_ERROR, e as Error)
        );
    }
};

export const invalidate: express.RequestHandler = async (req, res, next) => {
    const { message, signature, currentTicketId } = req.body;
    const { eventId, nft, ens, nonce } = message;

    if (!signature) {
        return next(badRequestException(TICKET_API_ERRORS.INVALID_BODY));
    }
    if (!isValidMessage(message)) {
        return next(
            badRequestException(TICKET_API_ERRORS.INVALID_MESSAGE_JSON)
        );
    }

    const account = req.context.account;

    try {
        const event = await getEvent(eventId);
        if (!event) {
            return next(badRequestException(TICKET_API_ERRORS.EVENT_NOT_FOUND));
        }

        if (DateTime.fromJSDate(event.endAt as Date) < DateTime.now()) {
            return next(
                badRequestException(TICKET_API_ERRORS.EVENT_INVALID_TERM)
            );
        }

        const currentTicket = await getAccountTicket(
            account.id,
            currentTicketId
        );
        if (!currentTicket || currentTicket.invalidated) {
            return next(notFoundException(TICKET_API_ERRORS.TICKET_NOT_FOUND));
        }

        if (nft) {
            const { isIncluded } = isAllowListIncluded(nft, event.allowList);
            if (!isIncluded) {
                return next(
                    badRequestException(TICKET_API_ERRORS.TOKEN_NOT_INCLUDED)
                );
            }
            const isTokenOwner = await isOwner(
                account.id,
                nft.chainId,
                nft.tokenType,
                nft.contractAddress,
                nft.tokenId
            );
            // check if the account has the token
            if (!isTokenOwner) {
                return next(
                    badRequestException(TICKET_API_ERRORS.NOT_TOKEN_OWNER)
                );
            }
        } else if (ens) {
            const { isIncluded } = isAllowListIncluded(
                { tokenType: 'ENS', ens },
                event.allowList
            );
            // check if the account's ens is included in the allow list
            if (!isIncluded) {
                return next(
                    badRequestException(TICKET_API_ERRORS.ENS_NOT_INCLUDED)
                );
            }
            // check if the account has the ens
            const addressInfo = await lookupAddress(ens);
            if (addressInfo.address !== account.id) {
                return next(
                    badRequestException(TICKET_API_ERRORS.NOT_ENS_OWNER)
                );
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
            ticketId: ticket.id,
        });

        return res.json(ticket);
    } catch (e) {
        return next(
            unknownException(TICKET_API_ERRORS.TICKET_UNKNOWN_ERROR, e as Error)
        );
    }
};
