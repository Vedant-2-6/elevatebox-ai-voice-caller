export interface ITwilioAdapter {
  sendWhatsAppMessage(to: string, message: string, mediaUrls?: string[]): Promise<void>;
}
