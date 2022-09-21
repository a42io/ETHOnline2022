import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';
import { ENSTicket, NFTTicket, Ticket } from '~/entities/ticket';
import { Condition, OrderBy } from '~/entities/query';
import CollectionReference = firestore.CollectionReference;
import { TokenType } from '~/entities/nft';
import DocumentSnapshot = firestore.DocumentSnapshot;

const db = admin.firestore();

export function toDB(
    ticket: Ticket | Omit<Ticket, 'id'>
): FirebaseFirestore.DocumentData {
    return {
        event_id: ticket.eventId,
        account: ticket.account,
        nonce: ticket.nonce,
        signature: ticket.signature,
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
        account: snapshot.get('account'),
        eventId: snapshot.get('event_id'),
        nonce: snapshot.get('nonce'),
        ens: snapshot.get('ens'),
        signature: snapshot.get('signature'),
        nft: nft
            ? {
                  chainId: nft.chain_id,
                  tokenType: nft.token_type as TokenType,
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

const ticketRef = db.collection('tickets');

function getAccountTicketsPath(account: string): CollectionReference {
    return db.collection('accounts').doc(account).collection('tickets');
}

export const getAccountTickets = async (
    account: string,
    conditions: Condition[],
    orderBy?: OrderBy,
    cursor?: string,
    limit?: number
): Promise<Ticket[]> => {
    let querySnapshotRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
        getAccountTicketsPath(account);

    conditions.forEach((r) => {
        querySnapshotRef = querySnapshotRef.where(
            r.target,
            r.operator,
            r.value
        );
    });

    if (orderBy) {
        querySnapshotRef = querySnapshotRef.orderBy(
            orderBy.target,
            orderBy.operator
        );
    }

    if (cursor) {
        const snapshot = await getAccountTicketsPath(account).doc(cursor).get();
        if (snapshot.exists)
            querySnapshotRef = querySnapshotRef.startAfter(snapshot);
    }

    if (limit) {
        querySnapshotRef = querySnapshotRef.limit(limit);
    }

    const querySnapshot = await querySnapshotRef.get();
    if (!querySnapshot.empty) return [];

    return querySnapshot.docs.map((r) => fromDB(r));
};

export const getTicket = async (id: string): Promise<Ticket | null> => {
    const snapshot = await ticketRef.doc(id).get();
    if (!snapshot.exists) return null;
    return fromDB(snapshot);
};

export const getAccountTicket = async (
    account: string,
    id: string
): Promise<Ticket | null> => {
    const snapshot = await getAccountTicketsPath(account).doc(id).get();
    if (!snapshot.exists) return null;
    return fromDB(snapshot);
};

export const createTicket = async (
    account: string,
    ticket: Omit<Ticket, 'id' | 'createdAt'>
): Promise<Ticket> => {
    const ref = getAccountTicketsPath(account);
    const id = ref.doc().id;
    const data = toDB({
        ...ticket,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ticket/{id}
    await ticketRef.doc(id).set(data, { merge: true });
    // accounts/{accountId}/tickets/{id}
    await ref.doc(id).set(data, { merge: true });

    return { id, ...ticket } as Ticket;
};

export const setVerifiedTicket = async (
    account: string,
    ticketId: string
): Promise<void | null> => {
    const update = {
        verified_at: firestore.FieldValue.serverTimestamp(),
    };
    // ticket/{id}
    await ticketRef.doc(ticketId).set(update, { merge: true });
    const ref = getAccountTicketsPath(account);
    // accounts/{accountId}/tickets/{id}
    await ref.doc(ticketId).set(update, { merge: true });
};

export const invalidateTicket = async (
    account: string,
    currentTicketId: string,
    ticket: Omit<Ticket, 'id'>
): Promise<Ticket> => {
    const update = {
        invalidated: true,
        invalidated_at: firestore.FieldValue.serverTimestamp(),
    };
    // ticket/{id}
    await ticketRef.doc(currentTicketId).set(update, { merge: true });
    const ref = getAccountTicketsPath(account);
    // accounts/{accountId}/tickets/{id}
    await ref.doc(currentTicketId).set(update, { merge: true });

    return await createTicket(account, ticket);
};
