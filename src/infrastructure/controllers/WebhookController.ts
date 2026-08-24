import { Request, Response } from 'express';
import { LeadService } from '../../application/services/LeadService';
import { z } from 'zod';
import crypto from 'crypto';

const qualifyLeadSchema = z.object({
  intent: z.enum(['Hot', 'Warm', 'Cold', 'Unknown']),
  budget: z.string(),
  products: z.string(),
  timeline: z.string(),
  features: z.string(),
});

const scheduleCallbackSchema = z.object({
  datetime: z.string(),
});

export class WebhookController {
  constructor(private leadService: LeadService) {}

  private verifySignature(req: Request): boolean {
    const vapiSecret = process.env.VAPI_WEBHOOK_SECRET;
    if (!vapiSecret) {
      console.warn('VAPI_WEBHOOK_SECRET is not configured. Skipping signature verification.');
      return true; // Bypass if not configured, but log warning
    }

    const signature = req.headers['x-vapi-signature'];
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    // Usually webhooks are signed using HMAC SHA256 of the raw body
    // Note: Since express.json() is used, req.body is already parsed.
    // For proper HMAC verification, we should use the raw body buffer. 
    // This is a basic illustration. If req.rawBody is available it should be used.
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', vapiSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  public handleVapiWebhook = async (req: Request, res: Response) => {
    try {
      if (!this.verifySignature(req)) {
        return res.status(401).send('Unauthorized: Invalid signature');
      }

      const payload = req.body;
      const type = payload?.message?.type;
      
      // Sanitized logging
      console.log(`Received Vapi Webhook - Type: ${type}, Call ID: ${payload?.message?.call?.id || 'Unknown'}`);

      if (type === 'tool-calls') {
        const toolCalls = payload.message.toolCalls;
        const phoneNumber = payload.message.call?.customer?.number;

        if (!phoneNumber) {
          return res.status(400).send('Missing customer phone number');
        }
        
        for (const call of toolCalls) {
          const functionName = call.function.name;
          const args = call.function.arguments;
          
          let parsedArgs;
          if (typeof args === 'string') {
            try {
              parsedArgs = JSON.parse(args);
            } catch (e) {
              console.error('Failed to parse tool arguments');
              return res.status(400).send('Invalid JSON in tool arguments');
            }
          } else {
            parsedArgs = args;
          }

          if (functionName === 'qualify_lead') {
            const validation = qualifyLeadSchema.safeParse(parsedArgs);
            if (!validation.success) {
              return res.status(400).json({ error: 'Invalid qualify_lead arguments', details: validation.error });
            }
            
            await this.leadService.processLeadQualification(
              phoneNumber,
              validation.data.intent,
              validation.data.budget,
              validation.data.products,
              validation.data.timeline,
              validation.data.features
            );
          } else if (functionName === 'schedule_callback') {
            const validation = scheduleCallbackSchema.safeParse(parsedArgs);
            if (!validation.success) {
              return res.status(400).json({ error: 'Invalid schedule_callback arguments', details: validation.error });
            }
            await this.leadService.scheduleCallback(phoneNumber, validation.data.datetime);
          }
        }
        
        return res.json({
          results: toolCalls.map((call: any) => ({
            toolCallId: call.id,
            result: 'Success',
          })),
        });
      }

      if (type === 'end-of-call-report') {
        const phoneNumber = payload.message.call?.customer?.number;
        if (!phoneNumber) {
          return res.status(400).send('Missing customer phone number');
        }

        const summary = payload.message.summary || 'No summary available';
        await this.leadService.sendPostCallSummary(phoneNumber, summary);
        return res.status(200).send('OK');
      }

      res.status(200).send('Unhandled event type');
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  };
}
