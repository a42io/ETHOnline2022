import * as admin from 'firebase-admin';
import { TicketingLog } from '~/entities/ticketingLog';
import { Condition, OrderBy } from '~/entities/query';
import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;
import CollectionReference = firestore.CollectionReference;
import { NFTTokenType } from '~/entities/nft';
const db = admin.firestore();

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
                  tokenType: nft.token_type as NFTTokenType,
                  contractAddress: nft.contract_address,
                  tokenId: nft.token_id,
              }
            : undefined,
        createdAt: snapshot.get('created_at')?.toDate(),
        updatedAt: snapshot.get('updated_at')?.toDate(),
    };
}

function getLogPath(eventId: string): CollectionReference {
    return db.collection('events').doc(eventId).collection('ticketing_logs');
}

export const getTicketingLogs = async (
    eventId: string,
    conditions: Condition[],
    orderBy?: OrderBy,
    cursor?: string,
    limit?: number
): Promise<TicketingLog[]> => {
    let querySnapshotRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
        getLogPath(eventId);

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
        const snapshot = await getLogPath(eventId).doc(cursor).get();
        if (snapshot.exists)
            querySnapshotRef = querySnapshotRef.startAfter(snapshot);
    }

    if (limit) {
        querySnapshotRef = querySnapshotRef.limit(limit);
    }

    const querySnapshot = await querySnapshotRef.get();
    if (querySnapshot.empty) return [];
    return querySnapshot.docs.map((r) => fromDB(r));
};

export const getTicketingLog = async (
    eventId: string,
    id: string
): Promise<TicketingLog | null> => {
    const snapshot = await getLogPath(eventId).doc(id).get();
    if (!snapshot.exists) return null;
    return fromDB(snapshot);
};

export const createTicketingLog = async (
    eventId: string,
    log: Omit<TicketingLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TicketingLog> => {
    const ref = getLogPath(eventId);
    const id = ref.doc().id;
    const data = toDB({
        ...log,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await ref.doc(id).set(data, { merge: true });
    return { id, ...log } as TicketingLog;
};
