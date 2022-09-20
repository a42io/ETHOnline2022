import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';
import { EventTokenStatus, fromDB, toDB } from '~/entities/eventTokenStatus';
import CollectionReference = firestore.CollectionReference;

const db = admin.firestore();

function getStatusPath(eventId: string): CollectionReference {
    return db.collection('events').doc(eventId).collection('token_status');
}

export const getTokenStatus = async (
    eventId: string,
    id: string
): Promise<EventTokenStatus | null> => {
    try {
        const snapshot = await getStatusPath(eventId).doc(id).get();
        if (!snapshot.exists) return null;
        return fromDB(snapshot);
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const createTokenStatus = async (
    eventId: string
): Promise<EventTokenStatus | null> => {
    try {
        const ref = getStatusPath(eventId);
        const id = ref.doc().id;

        const status: Omit<EventTokenStatus, 'id'> = {
            totalUsageCount: 1,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        await ref.doc(id).set(toDB(status), { merge: true });
        return { id, ...status };
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const incrementUsageCount = async (
    eventId: string,
    id: string
): Promise<EventTokenStatus | null> => {
    try {
        const snapshot = await getStatusPath(eventId).doc(id).get();
        if (!snapshot.exists) {
            return await createTokenStatus(eventId);
        }

        await snapshot.ref.set({
            total_usage_count: firestore.FieldValue.increment(1),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        const status = fromDB(snapshot);
        status.totalUsageCount += 1;

        return status;
    } catch (e) {
        console.warn(e);
        return null;
    }
};
