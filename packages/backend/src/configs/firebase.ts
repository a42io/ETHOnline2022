import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

if (process.env.NODE_ENV === 'development') {
    dotenv.config();
}

admin.initializeApp({
    credential: admin.credential.cert(
        process.env.FIREBASE_SECRET_PATH as string
    ),
});

admin.firestore().settings({
    ignoreUndefinedProperties: true,
});
