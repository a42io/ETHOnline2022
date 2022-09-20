import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// load environment variables before initializing middlewares,routers, and error handler.
if (process.env.NODE_ENV === 'development') {
    dotenv.config();
}

// initialize firebase
import '~/configs/firebase';
// load routes
import router from '~/routes';
import { errorHandler } from '~/middlewares/ErrorHandler';

const app: express.Express = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(router);
app.use(errorHandler);

export default app;
