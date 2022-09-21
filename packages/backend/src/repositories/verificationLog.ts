import * as admin from 'firebase-admin';
import { VerificationLog, fromDB, toDB } from '~/entities/verificationLog';
import { Condition, OrderBy } from '~/entities/query';
import { firestore } from 'firebase-admin';
import CollectionReference = firestore.CollectionReference;
const db = admin.firestore();

function getLogPath(eventId: string): CollectionReference {
    return db.collection('events').doc(eventId).collection('verification_logs');
}

export const getVerificationLogs = async (
    eventId: string,
    conditions: Condition[],
    orderBy?: OrderBy,
    cursor?: string,
    limit?: number
): Promise<VerificationLog[] | null> => {
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

export const getVerificationLog = async (
    eventId: string,
    id: string
): Promise<VerificationLog | null> => {
    try {
        const snapshot = await getLogPath(eventId).doc(id).get();
        if (!snapshot.exists) return null;
        return fromDB(snapshot);
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const createVerificationLog = async (
    eventId: string,
    log: Omit<VerificationLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<VerificationLog | null> => {
    try {
        const ref = getLogPath(eventId);
        const id = ref.doc().id;
        const data = toDB({
            ...log,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await ref.doc(id).set(data, { merge: true });
        return { id, ...log } as VerificationLog;
    } catch (e) {
        console.warn(e);
        return null;
    }
};
