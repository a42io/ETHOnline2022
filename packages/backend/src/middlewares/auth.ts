import * as express from 'express';
import { utils } from 'ethers';
import { verifyJwt } from '~/libs/jwt';
import { getAccount, refreshNonce } from '~/repositories/account';
import {
    notFoundException,
    unauthorizedException,
    unknownException,
} from '~/middlewares/ErrorHandler';
import {
    MIDDLEWARE_AUTH_ERRORS,
    MIDDLEWARE_ETH_AUTH_ERRORS,
    UNKNOWN_ERROR,
} from '~/entities/error';
import { Account } from '~/entities/account';

export function getTokenFromHeader(req: express.Request): string | undefined {
    if (!req.headers.authorization) return undefined;

    const match = req.headers.authorization.match(/^Bearer (.*)$/);
    if (!match || !match[1]) {
        return undefined;
    }
    return match[1];
}

export const accessTokenAuth: express.RequestHandler = async (
    req,
    res,
    next
) => {
    const accessToken = getTokenFromHeader(req);
    if (!accessToken) {
        return next(
            unauthorizedException(MIDDLEWARE_AUTH_ERRORS.MISSING_ACCESS_TOKEN)
        );
    }

    try {
        try {
            req.context.jsonPayload = verifyJwt(accessToken);
        } catch (_e) {
            return next(
                unauthorizedException(
                    MIDDLEWARE_AUTH_ERRORS.INVALID_ACCESS_TOKEN
                )
            );
        }

        const account = await getAccount(res.locals.jsonPayload.data.id);
        if (!account) {
            return next(
                notFoundException(MIDDLEWARE_AUTH_ERRORS.ACCOUNT_NOT_FOUND)
            );
        }
        req.context.account = account;
        return next();
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};

export const ethAuth: express.RequestHandler = async (req, _res, next) => {
    const { message, signature } = req.body;
    if (!message || !signature) {
        return next(
            unauthorizedException(MIDDLEWARE_ETH_AUTH_ERRORS.INVALID_BODY)
        );
    }

    try {
        const signedMessage = JSON.stringify(message, null, 2);
        const derivedAddress = utils.verifyMessage(signedMessage, signature);
        const account = await getAccount(derivedAddress);
        if (!account) {
            return next(
                unauthorizedException(
                    MIDDLEWARE_ETH_AUTH_ERRORS.INVALID_ADDRESS
                )
            );
        }

        if (account.nonce !== message.nonce) {
            return next(
                unauthorizedException(
                    MIDDLEWARE_ETH_AUTH_ERRORS.INVALID_ADDRESS
                )
            );
        }

        req.context.account = (await refreshNonce(account)) as Account;
        return next();
    } catch (e) {
        return next(unknownException(UNKNOWN_ERROR, e as Error));
    }
};
