import * as admin from 'firebase-admin';
import { TicketingLog, fromDB, toDB } from '~/entities/ticketingLog';
import { Condition, OrderBy } from '~/entities/query';
import { firestore } from 'firebase-admin';
import CollectionReference = firestore.CollectionReference;
const db = admin.firestore();

function getLogPath(eventId: string): CollectionReference {
    return db.collection('events').doc(eventId).collection('ticketing_logs');
}

export const getTicketingLogs = async (
    eventId: string,
    conditions: Condition[],
    orderBy?: OrderBy,
    cursor?: string,
    limit?: number
): Promise<TicketingLog[] | null> => {
    try {
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
        if (!querySnapshot.empty) return [];
        return querySnapshot.docs.map((r) => fromDB(r));
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const getTicketingLog = async (
    eventId: string,
    id: string
): Promise<TicketingLog | null> => {
    try {
        const snapshot = await getLogPath(eventId).doc(id).get();
        if (!snapshot.exists) return null;
        return fromDB(snapshot);
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const createTicketingLog = async (
    eventId: string,
    log: Omit<TicketingLog, 'id'>
): Promise<TicketingLog | null> => {
    try {
        const ref = getLogPath(eventId);
        const id = ref.doc().id;
        log.createdAt = admin.firestore.FieldValue.serverTimestamp();
        log.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        const data = toDB(log);
        await ref.doc(id).set(data, { merge: true });
        return { id, ...log };
    } catch (e) {
        console.warn(e);
        return null;
    }
};
