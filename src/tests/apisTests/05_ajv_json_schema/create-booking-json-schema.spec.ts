import { test, expect } from '@fixtures/booker.fixture';
import createBookingSchema from '@testdata/schemas/create-booking.schema.json';
import { buildBookingFromGenerator } from '@testdata/booking.data';
import { SchemaValidator } from '@utils/SchemaValidator';

test.describe.serial('@P0 @schema Level 5 - Booking JSON schema validation', () => {
    let bookingId: number;

    test('POST /booking matches create-booking schema', async ({ bookingApi }) => {
        const body = await bookingApi.createBooking(buildBookingFromGenerator());
        bookingId = body.bookingid;
        SchemaValidator.assertValid(createBookingSchema, body, 'POST /booking');
    });

    test('DELETE /booking cleans up created booking', async ({ bookingApi }) => {
        const status = await bookingApi.deleteBooking(bookingId);
        expect(status).toBe(201);
    });
});
