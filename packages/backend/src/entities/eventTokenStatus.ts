import { firestore } from 'firebase-admin';
import { TokenType } from '~/entities/nft';

export type EventTokenStatus = {
    id: string;
    tokenType: TokenType;
    totalUsageCount: number;
    createdAt: Date | firestore.FieldValue;
    updatedAt: Date | firestore.FieldValue;
};
