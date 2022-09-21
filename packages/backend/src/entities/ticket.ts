import { firestore } from 'firebase-admin';
import { NFTTokenType } from '~/entities/nft';

export type ENSTicket = {
    id: string;
    account: string;
    eventId: string; // signed message param
    nonce: string; // signed message param
    ens: string; // signed message param
    signature: string;
    invalidated: boolean;
    createdAt: Date | firestore.FieldValue;
    verifiedAt?: Date | firestore.FieldValue;
    invalidatedAt?: Date | firestore.FieldValue;
};

export type NFTTicket = {
    id: string;
    account: string;
    eventId: string; // signed message param
    nonce: string; // signed message param
    nft: {
        chainId: string; // signed message param
        tokenType: NFTTokenType; // signed message param
        contractAddress: string; // signed message param
        tokenId?: string; // signed message param
    };
    signature: string;
    invalidated: boolean;
    createdAt: Date | firestore.FieldValue;
    verifiedAt?: Date | firestore.FieldValue;
    invalidatedAt?: Date | firestore.FieldValue;
};

export type Ticket = ENSTicket | NFTTicket;
