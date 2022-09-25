import { NFTTokenType } from './nft';
// ----------------------------------------------------------------------
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
    allowList: AllowListValue[];
    host: {
        addressOrEns: string;
        avatarUrl: string;
    };
    managers: Array<{
        address: string;
        role: AdminRole;
    }>;
    timezone: string;
    startAt: Date;
    endAt: Date;
    isCanceled?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    canceledAt?: Date;
};
