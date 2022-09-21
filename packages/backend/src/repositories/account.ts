import * as admin from 'firebase-admin';
import { Account } from '~/entities/account';
import { generateNonce } from '~/libs/nonce';
import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;

const db = admin.firestore();

const accountsRef = db.collection('accounts');

export function toDB(account: Account): DocumentData {
    return {
        nonce: account.nonce,
        created_at: account.createdAt,
        updated_at: account.updatedAt,
    };
}

export function fromDB(snapshot: DocumentSnapshot): Account {
    return {
        id: snapshot.id,
        nonce: snapshot.get('nonce'),
        createdAt: snapshot.get('created_at')?.toDate(),
        updatedAt: snapshot.get('updated_at')?.toDate(),
    };
}

export const getAccount = async (id: string): Promise<Account | null> => {
    const snapshot = await accountsRef.doc(id).get();
    if (!snapshot.exists) return null;
    return fromDB(snapshot);
};

export const createAccount = async (address: string): Promise<Account> => {
    const account = {
        id: address,
        nonce: generateNonce(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await setAccount(account);
    return account;
};

export const setAccount = async (account: Account): Promise<Account> => {
    const data = toDB(account);
    await accountsRef.doc(account.id).set(data, { merge: true });
    return account;
};

export const refreshNonce = async (account: Account): Promise<Account> => {
    account.nonce = generateNonce();
    account.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    const data = toDB(account);
    await accountsRef.doc(account.id).set(data, { merge: true });
    return account;
};
