import * as express from 'express';
import { ErrorCode, UNKNOWN_ERROR } from '~/entities/error';

export class ApiException extends Error {
    statusCode: number;
    data: ErrorCode | Record<string, never>;
    constructor(statusCode: number, data?: ErrorCode) {
        super(data?.code);
        this.statusCode = statusCode || 500;
        this.data = data ? { ...data } : {};
    }
}

export const badRequestException = (
    data?: ErrorCode,
    originalError?: Error
): ApiException => {
    if (originalError) console.log(originalError);
    return new ApiException(400, data);
};

export const unauthorizedException = (
    data?: ErrorCode,
    originalError?: Error
): ApiException => {
    if (originalError) console.log(originalError);
    return new ApiException(401, data);
};

export const notFoundException = (
    data?: ErrorCode,
    originalError?: Error
): ApiException => {
    if (originalError) console.log(originalError);
    return new ApiException(404, data);
};

export const unknownException = (
    data?: ErrorCode,
    originalError?: Error
): ApiException => {
    if (originalError) console.log(originalError);
    return new ApiException(500, data);
};

export const errorHandler: express.ErrorRequestHandler = (
    err: ApiException,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    if (res.headersSent) {
        return next(err);
    }
    let errorData = err.data;
    if (!errorData) {
        errorData = UNKNOWN_ERROR;
    }
    return res
        .status(err.statusCode || 500)
        .json({ code: errorData.code, message: errorData.description });
};
