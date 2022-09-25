import { NFTTokenType } from './nft';

export type ENSProof = {
    id: string;
    account: string;
    eventId: string; // signed message param
    nonce: string; // signed message param
    ens: string; // signed message param
    event: {
        host: {
            addressOrEns: string;
            avatarUrl: string;
        };
        title: string;
        description: string;
        startAt: Date | string | number;
        endAt: Date | string | number;
        cover: string;
    };
    signature: string;
    invalidated: boolean;
    createdAt: Date | string | number;
    verifiedAt?: Date | string | number;
    invalidatedAt?: Date | string | number;
};

export type NFTProof = {
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
    event: {
        host: {
            addressOrEns: string;
            avatarUrl: string;
        };
        title: string;
        description: string;
        startAt: Date | string | number;
        endAt: Date | string | number;
        cover: string;
    };
    signature: string;
    invalidated: boolean;
    createdAt: Date | string | number;
    verifiedAt?: Date | string | number;
    invalidatedAt?: Date | string | number;
};

export type Proof = ENSProof | NFTProof;
