import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';
import { AdminRole, Event } from '~/entities/event';
import { Condition, OrderBy } from '~/entities/query';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;
const db = admin.firestore();

const eventRef = db.collection('events');

export function toDB(event: Event | Omit<Event, 'id'>): DocumentData {
    return {
        cover: event.cover,
        title: event.title,
        description: event.description,
        body: event.body,
        host: {
            address_or_ens: event.host.addressOrEns,
            avatar_url: event.host.avatarUrl,
        },
        allowList: event.allowList.map((r) => {
            if (r.tokenType === 'ENS') {
                return {
                    token_type: 'ENS',
                    ens: r.ens,
                    available_usage_count: r.availableUsageCount,
                };
            }
            return {
                token_type: r.tokenType,
                chain_id: r.chainId,
                contract_address: r.contractAddress,
                token_id: r.tokenId,
                available_usage_count: r.availableUsageCount,
            };
        }),
        managers: event.managers.map((r) => ({
            address: r.address,
            role: r.role,
        })),
        timezone: event.timezone,
        start_at: event.startAt,
        end_at: event.endAt,
        is_canceled: event.isCanceled,
        created_at: event.createdAt,
        updated_at: event.updatedAt,
        canceled_at: event.canceledAt,
    };
}

export function fromDB(snapshot: DocumentSnapshot): Event {
    return {
        id: snapshot.id,
        cover: snapshot.get('cover'),
        title: snapshot.get('title'),
        description: snapshot.get('description'),
        body: snapshot.get('body'),
        host: {
            addressOrEns: snapshot.get('host')?.address_or_ens,
            avatarUrl: snapshot.get('host')?.avatar_url,
        },
        allowList: snapshot
            .get('allow_list')
            ?.map(
                (r: {
                    token_type: string;
                    ens: any;
                    available_usage_count: any;
                    chain_id: any;
                    contract_address: any;
                    token_id: any;
                }) => {
                    if (r.token_type === 'ENS') {
                        return {
                            tokenType: 'ENS',
                            ens: r.ens,
                            availableUsageCount: r.available_usage_count,
                        };
                    }
                    return {
                        tokenType: r.token_type,
                        chainId: r.chain_id,
                        contractAddress: r.contract_address,
                        tokenId: r.token_id,
                        availableUsageCount: r.available_usage_count,
                    };
                }
            ),
        managers: snapshot
            .get('managers')
            ?.map((r: { address: string; role: AdminRole }) => ({
                address: r.address,
                role: r.role,
            })),
        timezone: snapshot.get('timezone'),
        startAt: snapshot.get('start_at').toDate(),
        endAt: snapshot.get('end_at').toDate(),
        createdAt: snapshot.get('created_at').toDate(),
        updatedAt: snapshot.get('updated_at').toDate(),
    };
}

export const getEvents = async (
    conditions: Condition[],
    orderBy?: OrderBy,
    cursor?: string,
    limit?: number
): Promise<Event[]> => {
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
};

export const getEvent = async (id: string): Promise<Event | null> => {
    const snapshot = await eventRef.doc(id).get();
    if (!snapshot.exists) return null;
    return fromDB(snapshot);
};

export const createEvent = async (event: Omit<Event, 'id'>): Promise<Event> => {
    const id = eventRef.doc().id;
    event.createdAt = admin.firestore.FieldValue.serverTimestamp();
    event.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    const data = toDB(event);
    await eventRef.doc(id).set(data, { merge: true });
    return { id, ...event };
};

export const setEvent = async (event: Event): Promise<Event> => {
    event.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    const data = toDB(event);
    await eventRef.doc(event.id).set(data, { merge: true });
    return event;
};
