import express from 'express';
import { utils } from 'ethers';
import { signJwt } from '~/libs/jwt';
import { createAccount, getAccount } from '~/repositories/account';
import {
    badRequestException,
    unknownException,
} from '~/middlewares/ErrorHandler';
import { AUTH_API_ERRORS } from '~/entities/error';

export const nonce: express.RequestHandler = async (req, res, next) => {
    const a = req.query.a as string;
    if (!a || !utils.isAddress(a)) {
        return next(badRequestException(AUTH_API_ERRORS.INVALID_QUERY_PARAMS)); //todo
    }

    const address = utils.getAddress(a);
    try {
        const account = await getAccount(address);

        let nonce;
        if (!account) {
            nonce = (await createAccount(address)).nonce;
        } else {
            nonce = account.nonce;
        }

        return res.json({ nonce });
    } catch (e) {
        return next(
            unknownException(AUTH_API_ERRORS.AUTH_UNKNOWN_ERROR, e as Error)
        );
    }
};

export const signin: express.RequestHandler = async (_req, res, next) => {
    try {
        const user = res.locals.account;
        const exp = process.env.SESSION_EXPIRE;
        const data = { id: user.id };
        const accessToken = signJwt(exp as string, user.id, data);
        return res.json({ accessToken });
    } catch (e) {
        return next(
            unknownException(AUTH_API_ERRORS.AUTH_UNKNOWN_ERROR, e as Error)
        );
    }
};
