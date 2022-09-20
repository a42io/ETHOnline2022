import * as admin from 'firebase-admin';
import { Event, fromDB, toDB } from '~/entities/event';
import { Condition, OrderBy } from '~/entities/query';
const db = admin.firestore();

const eventRef = db.collection('events');

export const getEvents = async (
    conditions: Condition[],
    orderBy?: OrderBy,
    cursor?: string,
    limit?: number
): Promise<Event[] | null> => {
    try {
        let querySnapshotRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
            eventRef;

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
            const snapshot = await eventRef.doc(cursor).get();
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

export const getEvent = async (id: string): Promise<Event | null> => {
    try {
        const snapshot = await eventRef.doc(id).get();
        if (!snapshot.exists) return null;
        return fromDB(snapshot);
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const createEvent = async (
    event: Omit<Event, 'id'>
): Promise<Event | null> => {
    try {
        const id = eventRef.doc().id;
        event.createdAt = admin.firestore.FieldValue.serverTimestamp();
        event.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        const data = toDB(event);
        await eventRef.doc(id).set(data, { merge: true });
        return { id, ...event };
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const setEvent = async (event: Event): Promise<Event | null> => {
    try {
        event.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        const data = toDB(event);
        await eventRef.doc(event.id).set(data, { merge: true });
        return event;
    } catch (e) {
        console.warn(e);
        return null;
    }
};
