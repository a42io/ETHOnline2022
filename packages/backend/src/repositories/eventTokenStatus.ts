import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';
import { EventTokenStatus } from '~/entities/eventTokenStatus';
import DocumentData = firestore.DocumentData;
import DocumentSnapshot = firestore.DocumentSnapshot;
import CollectionReference = firestore.CollectionReference;
import { NFT, TokenType } from '~/entities/nft';

const db = admin.firestore();

export function toDB(
    eventTokenStatus: EventTokenStatus | Omit<EventTokenStatus, 'id'>
): DocumentData {
    return {
        total_usage_count: eventTokenStatus.totalUsageCount,
        token_type: eventTokenStatus.tokenType,
        created_at: eventTokenStatus.createdAt,
        updated_at: eventTokenStatus.updatedAt,
    };
}

export function fromDB(snapshot: DocumentSnapshot): EventTokenStatus {
    return {
        id: snapshot.id,
        totalUsageCount: snapshot.get('total_usage_count'),
        tokenType: snapshot.get('token_type') as TokenType,
        createdAt: snapshot.get('created_at')?.toDate(),
        updatedAt: snapshot.get('updated_at')?.toDate(),
    };
}

function getStatusPath(eventId: string): CollectionReference {
    return db.collection('events').doc(eventId).collection('token_status');
}

export function generateStatusId(ens?: string, nft?: Partial<NFT>) {
    if (ens) {
        return `${ens}`;
    }
    if (nft) {
        if (nft.tokenId)
            return `${nft.chainId}-${nft.contractAddress}-${nft.tokenId}`;

        return `${nft.chainId}-${nft.contractAddress}`;
    }
    return '';
}

export const getTokenStatus = async (
    eventId: string,
    id: string
): Promise<EventTokenStatus | null> => {
    const snapshot = await getStatusPath(eventId).doc(id).get();
    if (!snapshot.exists) return null;
    return fromDB(snapshot);
};

export const createTokenStatus = async (
    eventId: string,
    tokenType: TokenType
): Promise<EventTokenStatus> => {
    const ref = getStatusPath(eventId);
    const id = ref.doc().id;

    const status: Omit<EventTokenStatus, 'id'> = {
        totalUsageCount: 1,
        tokenType,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    await ref.doc(id).set(toDB(status), { merge: true });
    return { id, ...status };
};

export const incrementUsageCount = async (
    eventId: string,
    id: string,
    tokenType: TokenType
): Promise<EventTokenStatus> => {
    const snapshot = await getStatusPath(eventId).doc(id).get();
    if (!snapshot.exists) {
        return await createTokenStatus(eventId, tokenType);
    }

    await snapshot.ref.set({
        total_usage_count: firestore.FieldValue.increment(1),
        updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    const status = fromDB(snapshot);
    status.totalUsageCount += 1;

    return status;
};
