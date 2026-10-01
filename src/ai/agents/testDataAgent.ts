/**
 * testDataAgent — AI-powered realistic booking payload generator.
 *
 * Falls back to `buildBookingFromGenerator()` when no API key is configured.
 */

import { createAgent, type AgentResult } from '../agentFactory';
import { buildBookingFromGenerator } from '../../testdata/booking.data';
import type { Booking } from '../../api/BookingApi';

const bookingPayloadSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'BookingPayload',
    type: 'object',
    required: ['firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates'],
    additionalProperties: false,
    properties: {
        firstname: { type: 'string', minLength: 1, maxLength: 30 },
        lastname: { type: 'string', minLength: 1, maxLength: 30 },
        totalprice: { type: 'integer', minimum: 1, maximum: 9999 },
        depositpaid: { type: 'boolean' },
        bookingdates: {
            type: 'object',
            required: ['checkin', 'checkout'],
            additionalProperties: false,
            properties: {
                checkin: { type: 'string', format: 'date' },
                checkout: { type: 'string', format: 'date' },
            },
        },
        additionalneeds: { type: 'string', maxLength: 60 },
    },
};

const generateTestData = createAgent<{ scenario?: string }, Booking>({
    name: 'TestDataGenerator',
    systemPrompt:
        'You are a test data generator for a hotel booking API. ' +
        'Generate a single realistic hotel booking payload as JSON. ' +
        'Use realistic human names, reasonable prices, and near-future dates (2026). ' +
        'Return ONLY the JSON object, no markdown fences, no explanation.',
    userPrompt: (input) =>
        input.scenario
            ? `Generate a booking for this scenario: ${input.scenario}`
            : 'Generate a realistic hotel booking payload.',
    schema: bookingPayloadSchema,
    fallback: () => buildBookingFromGenerator(),
    options: { temperature: 0.8, maxTokens: 256 },
});

/** Generate a booking payload (AI or fallback). */
export async function generateBookingData(
    scenario?: string,
): Promise<AgentResult<Booking>> {
    return generateTestData({ scenario });
}
