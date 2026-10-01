/**
 * CustomDataGen.spec.ts — AI-powered test data generator demo.
 *
 * Uses the TestDataGenerator agent to produce realistic booking payloads.
 * Falls back to the deterministic Faker-based generator when no API key is set.
 *
 * Hard constraint: no assertion depends on model output.  We assert on schema
 * validity and HTTP status codes only.
 */

import { test, expect } from '../../fixtures/booker.fixture';
import { generateBookingData } from '../../ai/agents/testDataAgent';
import createBookingSchema from '../../testdata/schemas/create-booking.schema.json';
import { SchemaValidator } from '../../utils/SchemaValidator';

test.describe.serial('@ai @P1 AI Test Data Generator - Create Booking', () => {
    let bookingId: number;

    test('generate AI booking data and POST /booking', async ({ bookingApi }, testInfo) => {
        // ── Step 1: Generate booking data (AI or fallback) ──────
        const result = await generateBookingData('Business traveler on a weekend trip');

        // Attach the generated data + metadata for the AI Data tab
        const aiDataPayload = {
            agent: 'TestDataGenerator',
            isFallback: result.isFallback,
            reason: result.reason,
            metadata: result.metadata,
            generatedData: result.data,
        };

        await testInfo.attach('ai-data', {
            body: JSON.stringify(aiDataPayload, null, 2),
            contentType: 'application/json',
        });

        // ── Step 2: Validate payload against schema ─────────────
        // The booking payload (not the response envelope) must pass.
        const payloadValidation = SchemaValidator.validate(
            {
                type: 'object',
                required: ['firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates'],
                properties: {
                    firstname: { type: 'string' },
                    lastname: { type: 'string' },
                    totalprice: { type: 'number' },
                    depositpaid: { type: 'boolean' },
                    bookingdates: {
                        type: 'object',
                        required: ['checkin', 'checkout'],
                        properties: {
                            checkin: { type: 'string', format: 'date' },
                            checkout: { type: 'string', format: 'date' },
                        },
                    },
                    additionalneeds: { type: 'string' },
                },
            },
            result.data,
        );
        expect(payloadValidation.valid, `Payload validation errors: ${payloadValidation.errors.join(', ')}`).toBe(true);

        // ── Step 3: POST /booking and validate response ─────────
        const body = await bookingApi.createBooking(result.data);
        bookingId = body.bookingid;

        expect(bookingId).toBeGreaterThan(0);
        SchemaValidator.assertValid(createBookingSchema, body, 'POST /booking');

        // Log source of data
        if (result.isFallback) {
            console.log(`📦 Booking ${bookingId} created with FALLBACK data (no AI key)`);
        } else {
            console.log(
                `🤖 Booking ${bookingId} created with AI-generated data via ${result.metadata?.provider}/${result.metadata?.model} in ${result.metadata?.durationMs}ms`,
            );
        }
    });

    test('DELETE /booking cleans up AI-generated booking', async ({ bookingApi }) => {
        expect(bookingId, 'bookingId must be set by the previous test').toBeDefined();
        const status = await bookingApi.deleteBooking(bookingId);
        expect(status).toBe(201);
    });
});
