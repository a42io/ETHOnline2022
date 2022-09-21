import { firestore } from 'firebase-admin';

import { NFTTokenType } from '~/entities/nft';

export type VerificationLog = {
    id: string;
    account: string;
    ticketId: string;
    ens?: string;
    nft?: {
        chainId: string;
        tokenType: NFTTokenType;
        contractAddress: string;
        tokenId?: string;
    };
    totalUsageCount: number;
    createdAt: Date | firestore.FieldValue;
    updatedAt: Date | firestore.FieldValue;
};
