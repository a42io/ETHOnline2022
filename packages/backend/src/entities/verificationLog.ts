import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;
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

export function toDB(
    log: VerificationLog | Omit<VerificationLog, 'id'>
): DocumentData {
    return {
        account: log.account,
        ticket_id: log.ticketId,
        ens: log.ens,
        nft: log.nft
            ? {
                  chain_id: log.nft.chainId,
                  token_type: log.nft.tokenType,
                  contract_address: log.nft.contractAddress,
                  token_id: log.nft.tokenId,
              }
            : undefined,
        total_usage_count: log.totalUsageCount,
        created_at: log.createdAt,
        updated_at: log.updatedAt,
    };
}

export function fromDB(snapshot: DocumentSnapshot): VerificationLog {
    const nft = snapshot.get('nft');
    return {
        id: snapshot.id,
        account: snapshot.get('account'),
        ticketId: snapshot.get('ticket_id'),
        ens: snapshot.get('ens'),
        nft: nft
            ? {
                  chainId: nft.chain_id,
                  tokenType: nft.token_type,
                  contractAddress: nft.contract_address,
                  tokenId: nft.token_id,
              }
            : undefined,
        totalUsageCount: snapshot.get('total_usage_count'),
        createdAt: snapshot.get('created_at')?.toDate(),
        updatedAt: snapshot.get('updated_at')?.toDate(),
    };
}
