import { type Request, Router } from 'express';
import { type IUser } from '../db/User';

/* ROUTES */
import auth from './auth';
import public_ from './public';
import payment from './payment';
import settings from './settings';
import { ISettings } from '../db/Settings';
import { Networks } from '../data/Networks';

const router = Router();
router.use("/", public_);
router.use('/auth', auth);
router.use('/payment', payment);
router.use('/settings', settings);

export type UserRequest = Request & { user?: IUser };
export type PublicRequest = 
    Request &
    { user?: IUser } &
    { settings?:
        ISettings &
        { availableNetworks: Array<keyof typeof Networks> }
    };

export default router;