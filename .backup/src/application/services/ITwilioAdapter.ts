export interface ITwilioAdapter {
  sendWhatsAppMessage(to: string, message: string, mediaUrl?: string): Promise<void>;
}
