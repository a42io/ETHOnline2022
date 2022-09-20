import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';
import { fromDB, Ticket, toDB } from '~/entities/ticket';
import { Condition, OrderBy } from '~/entities/query';
import CollectionReference = firestore.CollectionReference;

const db = admin.firestore();

function getAccountTicketsPath(account: string): CollectionReference {
    return db.collection('accounts').doc(account).collection('tickets');
}

export const getAccountTickets = async (
    account: string,
    conditions: Condition[],
    orderBy?: OrderBy,
    cursor?: string,
    limit?: number
): Promise<Ticket[] | null> => {
    try {
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
            const snapshot = await getAccountTicketsPath(account)
                .doc(cursor)
                .get();
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

export const getAccountTicket = async (
    account: string,
    id: string
): Promise<Ticket | null> => {
    try {
        const snapshot = await getAccountTicketsPath(account).doc(id).get();
        if (!snapshot.exists) return null;
        return fromDB(snapshot);
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const createTicket = async (
    eventId: string,
    ticket: Omit<Ticket, 'id'>
): Promise<Ticket | null> => {
    try {
        const ref = getAccountTicketsPath(eventId);
        const id = ref.doc().id;
        ticket.invalidated = false;
        ticket.createdAt = admin.firestore.FieldValue.serverTimestamp();
        const data = toDB(ticket);
        await ref.doc(id).set(data, { merge: true });
        return { id, ...ticket } as Ticket;
    } catch (e) {
        console.warn(e);
        return null;
    }
};

export const invalidateTicket = async (
    eventId: string,
    currentTicketId: string,
    ticket: Omit<Ticket, 'id'>
): Promise<Ticket | null> => {
    try {
        const ref = getAccountTicketsPath(eventId);
        await ref.doc(currentTicketId).set(
            {
                invalidated: true,
                invalidated_at: firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        return await createTicket(eventId, ticket);
    } catch (e) {
        console.warn(e);
        return null;
    }
};
