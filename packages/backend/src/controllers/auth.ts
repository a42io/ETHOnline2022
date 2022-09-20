import express from 'express';
import { utils } from 'ethers';
import * as admin from 'firebase-admin';
import { signJwt } from '~/libs/jwt';
import { generateNonce } from '~/libs/nonce';
import { getAccount, setAccount } from '~/repositories/account';

export const nonce: express.RequestHandler = async (req, res, next) => {
    const a = req.query.a as string;
    if (!a || !utils.isAddress(a)) {
        return next(''); //todo
    }

    const address = utils.getAddress(a);
    try {
        const account = await getAccount(address);

        let nonce;
        if (!account) {
            nonce = generateNonce();
            await setAccount({
                id: address,
                nonce,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        } else {
            nonce = account.nonce;
        }

        return res.json({ nonce });
    } catch (e) {
        return next(''); //todo
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
        return next('');
    }
};
