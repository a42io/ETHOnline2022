import { firestore } from 'firebase-admin';

export type Account = {
    id: string;
    nonce: string;
    createdAt: Date | firestore.FieldValue;
    updatedAt: Date | firestore.FieldValue;
};
