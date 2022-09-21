import { firestore } from 'firebase-admin';
import { NFTTokenType } from '~/entities/nft';

export type AdminRole = 'admin' | 'operator';

export type AllowListENS = {
    tokenType: 'ENS';
    ens: string;
    availableUsageCount: number;
};

export type AllowListNFT = {
    chainId: string;
    tokenType: NFTTokenType;
    contractAddress: string;
    tokenId?: string;
    availableUsageCount: number;
};

export type AllowListValue = AllowListNFT | AllowListENS;

export type Event = {
    id: string;
    cover: string;
    title: string;
    description: string;
    body: string;
    host: {
        addressOrEns: string;
        avatarUrl: string;
    };
    managers: Array<{
        address: string;
        role: AdminRole;
    }>;
    timezone: string;
    allowList: AllowListValue[];
    startAt: Date | firestore.FieldValue;
    endAt: Date | firestore.FieldValue;
    isCanceled?: boolean;
    createdAt: Date | firestore.FieldValue;
    updatedAt: Date | firestore.FieldValue;
    canceledAt?: Date | firestore.FieldValue;
};
