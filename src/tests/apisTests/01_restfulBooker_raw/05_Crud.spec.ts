import { test, expect } from '@playwright/test'
import { logger } from '@utils/Logger'

interface BookingDates {
    checkin: string,
    checkout: string
}

interface BookingPayload {
    firstname: string,
    lastname: string,
    totalprice: number,
    depositpaid: boolean,
    bookingdates: BookingDates
    additionalneeds: string
}

// interface UpdatingPayload {
//     firstname: string,
//     lastname: string,
//     totalprice: number,
//     depositpaid: boolean,
//     bookingdates: BookingDates
//     additionalneeds: string
// }

interface AuthTokenResponse {
    token: string;
}
interface CreateBookingResponse {
    bookingid: number;
    booking: BookingPayload;
}

interface BookingFlowState {
    token?: string;
    bookingId?: number;
}

test.describe.serial('Restful Booker CRUD API', () => {
    const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    const bookingFlowState: BookingFlowState = {};
    const payload1: BookingPayload = {
        firstname: 'Rushikesh',
        lastname: 'Udawant',
        totalprice: 555,
        depositpaid: true,
        bookingdates: {
            checkin: '2018-01-01',
            checkout: '2019-01-01',
        },
        additionalneeds: 'Lunch',
    };

    const payload2: BookingPayload = {
        firstname: 'Shreya',
        lastname: 'Udawant',
        totalprice: 666,
        depositpaid: true,
        bookingdates: {
            checkin: '2018-01-06',
            checkout: '2019-01-06',
        },
        additionalneeds: 'Dinner',
    }

    test('TC#1 @p0 - Create token', async ({ request }) => {
        await test.step('Create token', async () => {
            const responseData = await request.post(`${baseUrl}/auth`, {
                headers,
                data: {
                    username: 'admin',
                    password: 'password123',
                },
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as AuthTokenResponse;
            expect(data.token).toBeTruthy();

            bookingFlowState.token = data.token;
            logger.info('Created auth token for CRUD flow');
        });
    });

    test('TC#2 @p0 - Create Booking', async ({ request }) => {
        await test.step('Create Booking', async () => {
            const responseData = await request.post(`${baseUrl}/booking`, {
                headers,
                data: payload1
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as CreateBookingResponse;
            expect(data.bookingid).toBeTruthy();
            expect(data.booking.firstname).toBe(payload1.firstname);
            expect(data.booking.lastname).toBe(payload1.lastname);
            bookingFlowState.bookingId = data.bookingid;
            logger.info(`Created BookingId for CRUD flow: ${bookingFlowState.bookingId}`);

        });
    });

    test('TC#3 @p0 - Validate Booking', async ({ request }) => {
        await test.step('Validate Booking', async () => {
            const responseData = await request.get(`${baseUrl}/booking/${bookingFlowState.bookingId}`, {
                headers,
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as BookingPayload;
            expect(data.firstname).toBe(payload1.firstname);
            expect(data.lastname).toBe(payload1.lastname);
            logger.info(`Validated that the Booking is created`);

        });
    });


    test('TC#4 @p0 - Update Booking', async ({ request }) => {
        await test.step('Update Booking', async () => {
            const token = bookingFlowState.token;
            const bookingId = bookingFlowState.bookingId;
            if (!token || !bookingId) {
                throw new Error('Created token and created booking ID must pass before updating')
            }
            const responseData = await request.put(`${baseUrl}/booking/${bookingId}`, {
                headers: {
                    ...headers,
                    'Cookie': `token=${token}`
                },
                data: payload2,
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as BookingPayload;
            expect(data.firstname).toBe(payload2.firstname);
            expect(data.lastname).toBe(payload2.lastname);
            logger.info(`Updated the bookingId ${bookingFlowState.bookingId}:${data.firstname} ${data.lastname}`);
        });
    });


});


