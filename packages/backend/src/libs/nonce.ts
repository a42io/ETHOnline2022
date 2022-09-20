import crypto from 'crypto';

export function generateNonce() {
    return crypto.randomBytes(32).toString('hex');
}
