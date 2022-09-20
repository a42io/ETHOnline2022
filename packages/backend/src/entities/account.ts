import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;

export type Account = {
    id: string;
    nonce: string;
    createdAt: Date | firestore.FieldValue;
    updatedAt: Date | firestore.FieldValue;
};

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
