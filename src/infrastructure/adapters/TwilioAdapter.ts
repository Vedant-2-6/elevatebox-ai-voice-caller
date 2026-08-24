import { Twilio } from 'twilio';
import { ITwilioAdapter } from '../../application/services/ITwilioAdapter';

export class TwilioAdapter implements ITwilioAdapter {
  private client: Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      throw new Error('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER) are missing in .env');
    }

    this.client = new Twilio(accountSid, authToken);
  }

  async sendWhatsAppMessage(to: string, message: string, mediaUrl?: string): Promise<void> {
    try {
      const payload: any = {
        from: this.fromNumber,
        to: `whatsapp:${to.replace('whatsapp:', '')}`,
        body: message,
      };

      if (mediaUrl) {
        payload.mediaUrl = [mediaUrl];
      }

      await this.client.messages.create(payload);
      console.log(`WhatsApp message sent to ${to}`);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
}
