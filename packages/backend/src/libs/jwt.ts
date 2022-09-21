import jwt, { Algorithm, Secret } from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
const algorithm = process.env.JWT_ALGORITHM;

export function verifyJwt(token: string) {
    return jwt.verify(token, secret as Secret, {
        algorithms: [algorithm as Algorithm],
    });
}

export function signJwt(
    exp: string,
    userId: string,
    data: { id: string }
): string {
    return jwt.sign(
        {
            sub: userId,
            data,
        },
        secret as Secret,
        {
            expiresIn: exp,
        }
    );
}
