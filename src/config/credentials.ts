// import { envOr } from './env';

// export const credentials = {
//     standardUser: envOr('STANDARD_USER', 'standard_user'),
//     password: envOr('TTA_SECRET', 'tta_secret'),
// } as const;


export const credentials = {
    standardUser: process.env.STANDARD_USER ?? '',
    password: process.env.TTA_SECRET ?? ''
} as const;

