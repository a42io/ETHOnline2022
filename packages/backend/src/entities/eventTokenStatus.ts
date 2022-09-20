import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;

export type EventTokenStatus = {
    id: string;
    totalUsageCount: number;
    createdAt: Date | firestore.FieldValue;
    updatedAt: Date | firestore.FieldValue;
};

export function toDB(
    eventTokenStatus: EventTokenStatus | Omit<EventTokenStatus, 'id'>
): DocumentData {
    return {
        total_usage_count: eventTokenStatus.totalUsageCount,
        created_at: eventTokenStatus.createdAt,
        updated_at: eventTokenStatus.updatedAt,
    };
}

export function fromDB(snapshot: DocumentSnapshot): EventTokenStatus {
    return {
        id: snapshot.id,
        totalUsageCount: snapshot.get('total_usage_count'),
        createdAt: snapshot.get('created_at')?.toDate(),
        updatedAt: snapshot.get('updated_at')?.toDate(),
    };
}
