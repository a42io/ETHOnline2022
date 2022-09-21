import { firestore } from 'firebase-admin';

import { NFTTokenType } from '~/entities/nft';

export type TicketingLog = {
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
    createdAt: Date | firestore.FieldValue;
    updatedAt: Date | firestore.FieldValue;
};
