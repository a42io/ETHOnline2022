import { firestore } from 'firebase-admin';
import DocumentSnapshot = firestore.DocumentSnapshot;

type ENSTicket = {
    id: string;
    eventId: string;
    nonce: string;
    ens: string;
    invalidated: boolean;
    createdAt: Date | firestore.FieldValue;
    verifiedAt?: Date | firestore.FieldValue;
    invalidatedAt?: Date | firestore.FieldValue;
};

type NFTTicket = {
    id: string;
    eventId: string;
    nonce: string;
    nft: {
        chainId: string;
        tokenType: string;
        contractAddress: string;
        tokenId?: string;
    };
    invalidated: boolean;
    createdAt: Date | firestore.FieldValue;
    verifiedAt?: Date | firestore.FieldValue;
    invalidatedAt?: Date | firestore.FieldValue;
};

export type Ticket = ENSTicket | NFTTicket;

export function toDB(
    ticket: Ticket | Omit<Ticket, 'id'>
): FirebaseFirestore.DocumentData {
    return {
        event_id: ticket.eventId,
        nonce: ticket.nonce,
        ens: (ticket as ENSTicket)?.ens,
        nft: (ticket as NFTTicket).nft
            ? {
                  chain_id: (ticket as NFTTicket).nft.chainId,
                  token_type: (ticket as NFTTicket).nft.tokenType,
                  contract_address: (ticket as NFTTicket).nft.contractAddress,
                  token_id: (ticket as NFTTicket).nft.tokenId,
              }
            : undefined,
        invalidated: ticket.invalidated,
        created_at: ticket.createdAt,
        verified_at: ticket.verifiedAt,
        invalidated_at: ticket.invalidatedAt,
    };
}

export function fromDB(snapshot: DocumentSnapshot): Ticket {
    const nft = snapshot.get('nft');

    return {
        id: snapshot.id,
        eventId: snapshot.get('event_id'),
        nonce: snapshot.get('nonce'),
        ens: snapshot.get('ens'),
        nft: nft
            ? {
                  chainId: nft.chain_id,
                  tokenType: nft.token_type,
                  contractAddress: nft.contract_address,
                  tokenId: nft.token_id,
              }
            : undefined,
        invalidated: snapshot.get('invalidated'),
        createdAt: snapshot.get('created_at')?.toDate(),
        verifiedAt: snapshot.get('verified_at')?.toDate(),
        invalidatedAt: snapshot.get('invalidated_at')?.toDate(),
    };
}
