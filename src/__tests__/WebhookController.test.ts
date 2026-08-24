import request from 'supertest';
import app from '../server';
import crypto from 'crypto';
import { SQLiteLeadRepository } from '../infrastructure/adapters/SQLiteLeadRepository';
import { TwilioAdapter } from '../infrastructure/adapters/TwilioAdapter';
import { LeadService } from '../application/services/LeadService';
import { WebhookController } from '../infrastructure/controllers/WebhookController';

// We can mock the TwilioAdapter to prevent actual messages
jest.mock('../infrastructure/adapters/TwilioAdapter');

describe('WebhookController Integration Test', () => {
  const vapiSecret = 'test-secret';
  
  beforeAll(() => {
    process.env.VAPI_WEBHOOK_SECRET = vapiSecret;
  });

  const generateSignature = (body: any) => {
    const rawBody = JSON.stringify(body);
    return crypto.createHmac('sha256', vapiSecret).update(rawBody).digest('hex');
  };

  it('should return 401 Unauthorized if signature is missing', async () => {
    const response = await request(app)
      .post('/api/webhooks/vapi')
      .send({ message: { type: 'tool-calls' } });
      
    expect(response.status).toBe(401);
  });

  it('should process qualify_lead tool call successfully', async () => {
    const payload = {
      message: {
        type: 'tool-calls',
        call: { customer: { number: 'whatsapp:+919876543210' }, id: 'call_123' },
        toolCalls: [
          {
            id: 'tc_1',
            function: {
              name: 'qualify_lead',
              arguments: JSON.stringify({
                intent: 'Hot',
                budget: '$5000',
                products: 'clothing',
                timeline: '2 weeks',
                features: 'payment gateway',
              }),
            },
          },
        ],
      },
    };

    const signature = generateSignature(payload);

    const response = await request(app)
      .post('/api/webhooks/vapi')
      .set('x-vapi-signature', signature)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [{ toolCallId: 'tc_1', result: 'Success' }],
    });
  });
});
