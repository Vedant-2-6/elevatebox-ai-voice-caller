export type Intent = 'Hot' | 'Warm' | 'Cold' | 'Unknown';

export interface Lead {
  id: string;
  phoneNumber: string;
  intent: Intent;
  budget: string;
  products: string;
  timeline: string;
  features: string;
  scheduledCallback?: string;
  createdAt: Date;
  updatedAt: Date;
}
