import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;

export type AdminRole = 'admin' | 'operator';

export type AllowListValue =
    | {
          chainId: string;
          tokenType: 'ERC721' | 'ERC1155';
          contractAddress: string;
          tokenId?: string;
          availableUsageCount: number;
      }
    | {
          tokenType: 'ENS';
          ens: string;
          availableUsageCount: number;
      };

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
    createdAt: Date | firestore.FieldValue;
    updatedAt: Date | firestore.FieldValue;
};

export function toDB(event: Event): DocumentData {
    return {
        cover: event.cover,
        title: event.title,
        description: event.description,
        body: event.body,
        host: {
            address_or_ens: event.host.addressOrEns,
            avatar_url: event.host.avatarUrl,
        },
        allowList: event.allowList.map((r) => {
            if (r.tokenType === 'ENS') {
                return {
                    token_type: 'ENS',
                    ens: r.ens,
                    available_usage_count: r.availableUsageCount,
                };
            }
            return {
                token_type: r.tokenType,
                chain_id: r.chainId,
                contract_address: r.contractAddress,
                token_id: r.tokenId,
                available_usage_count: r.availableUsageCount,
            };
        }),
        managers: event.managers.map((r) => ({
            address: r.address,
            role: r.role,
        })),
        timezone: event.timezone,
        start_at: event.startAt,
        end_at: event.endAt,
        created_at: event.createdAt,
        updated_at: event.updatedAt,
    };
}

export function fromDB(snapshot: DocumentSnapshot): Event {
    return {
        id: snapshot.id,
        cover: snapshot.get('cover'),
        title: snapshot.get('title'),
        description: snapshot.get('description'),
        body: snapshot.get('body'),
        host: {
            addressOrEns: snapshot.get('host')?.address_or_ens,
            avatarUrl: snapshot.get('host')?.avatar_url,
        },
        allowList: snapshot
            .get('allow_list')
            ?.map(
                (r: {
                    token_type: string;
                    ens: any;
                    available_usage_count: any;
                    chain_id: any;
                    contract_address: any;
                    token_id: any;
                }) => {
                    if (r.token_type === 'ENS') {
                        return {
                            tokenType: 'ENS',
                            ens: r.ens,
                            availableUsageCount: r.available_usage_count,
                        };
                    }
                    return {
                        tokenType: r.token_type,
                        chainId: r.chain_id,
                        contractAddress: r.contract_address,
                        tokenId: r.token_id,
                        availableUsageCount: r.available_usage_count,
                    };
                }
            ),
        managers: snapshot
            .get('managers')
            ?.map((r: { address: string; role: AdminRole }) => ({
                address: r.address,
                role: r.role,
            })),
        timezone: snapshot.get('timezone'),
        startAt: snapshot.get('start_at').toDate(),
        endAt: snapshot.get('end_at').toDate(),
        createdAt: snapshot.get('created_at').toDate(),
        updatedAt: snapshot.get('updated_at').toDate(),
    };
}
