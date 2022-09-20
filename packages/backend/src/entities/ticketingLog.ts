import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;

export type TicketingLog = {
    id: string;
    account: string;
    ticketId: string;
    ens?: string;
    nft?: {
        chainId: string;
        tokenType: string;
        contractAddress: string;
        tokenId?: string;
    };
    createdAt: Date | firestore.FieldValue;
    updatedAt: Date | firestore.FieldValue;
};

export function toDB(
    log: TicketingLog | Omit<TicketingLog, 'id'>
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
        created_at: log.createdAt,
        updated_at: log.updatedAt,
    };
}

export function fromDB(snapshot: DocumentSnapshot): TicketingLog {
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
        createdAt: snapshot.get('created_at')?.toDate(),
        updatedAt: snapshot.get('updated_at')?.toDate(),
    };
}
