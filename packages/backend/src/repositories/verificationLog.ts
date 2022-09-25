import * as admin from 'firebase-admin';
import { VerificationLog } from '~/entities/verificationLog';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;
import { Condition, OrderBy } from '~/entities/query';
import { firestore } from 'firebase-admin';
import CollectionReference = firestore.CollectionReference;
const db = admin.firestore();

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

function getLogPath(eventId: string): CollectionReference {
    return db.collection('events').doc(eventId).collection('verification_logs');
}

export const getVerificationLogs = async (
    eventId: string,
    conditions: Condition[],
    orderBy?: OrderBy,
    cursor?: string,
    limit?: number
): Promise<VerificationLog[]> => {
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

export const getVerificationLog = async (
    eventId: string,
    id: string
): Promise<VerificationLog | null> => {
    const snapshot = await getLogPath(eventId).doc(id).get();
    if (!snapshot.exists) return null;
    return fromDB(snapshot);
};

export const createVerificationLog = async (
    eventId: string,
    log: Omit<VerificationLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<VerificationLog> => {
    const ref = getLogPath(eventId);
    const id = ref.doc().id;
    const data = toDB({
        ...log,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await ref.doc(id).set(data, { merge: true });
    return { id, ...log } as VerificationLog;
};
