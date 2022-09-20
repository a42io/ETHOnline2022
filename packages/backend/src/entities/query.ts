import { firestore } from 'firebase-admin';
import WhereFilterOp = firestore.WhereFilterOp;

export type Condition = {
    target: string;
    operator: WhereFilterOp;
    value: any;
};

export type OrderBy = {
    target: string;
    operator: 'desc' | 'asc';
};
