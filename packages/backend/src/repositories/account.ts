import * as admin from 'firebase-admin';
import { Account, fromDB, toDB } from '~/entities/account';
import { generateNonce } from '~/libs/nonce';
const db = admin.firestore();

const accountsRef = db.collection('accounts');

export const getAccount = async (id: string): Promise<Account | null> => {
    try {
        const snapshot = await accountsRef.doc(id).get();
        if (!snapshot.exists) return null;
        return fromDB(snapshot);
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const setAccount = async (account: Account): Promise<Account | null> => {
    try {
        const data = toDB(account);
        await accountsRef.doc(account.id).set(data, { merge: true });
        return account;
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const refreshNonce = async (
    account: Account
): Promise<Account | null> => {
    try {
        account.nonce = generateNonce();
        account.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        const data = toDB(account);
        await accountsRef.doc(account.id).set(data, { merge: true });
        return account;
    } catch (e) {
        console.warn(e);
        return null;
    }
};
