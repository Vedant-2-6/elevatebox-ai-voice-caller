import { Intent, Lead } from '../../domain/entities/Lead';
import { ILeadRepository } from './ILeadRepository';
import { ITwilioAdapter } from './ITwilioAdapter';
import { v4 as uuidv4 } from 'uuid';

export class LeadService {
  constructor(
    private leadRepository: ILeadRepository,
    private twilioAdapter: ITwilioAdapter
  ) {}

  async processLeadQualification(
    phoneNumber: string,
    intent: Intent,
    budget: string,
    products: string,
    timeline: string,
    features: string
  ): Promise<void> {
    let lead = await this.leadRepository.findByPhoneNumber(phoneNumber);

    if (!lead) {
      lead = {
        id: uuidv4(),
        phoneNumber,
        intent,
        budget,
        products,
        timeline,
        features,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.leadRepository.save(lead);
    } else {
      lead.intent = intent;
      lead.budget = budget;
      lead.products = products;
      lead.timeline = timeline;
      lead.features = features;
      lead.updatedAt = new Date();
      await this.leadRepository.update(lead);
    }

    if (intent === 'Hot') {
      await this.triggerMidCallWhatsApp(lead);
    }
  }

  async scheduleCallback(phoneNumber: string, datetime: string): Promise<void> {
    const lead = await this.leadRepository.findByPhoneNumber(phoneNumber);
    if (lead) {
      lead.scheduledCallback = datetime;
      lead.updatedAt = new Date();
      await this.leadRepository.update(lead);
    }
  }

  async triggerMidCallWhatsApp(lead: Lead): Promise<void> {
    const message = `Hi there! We noticed you're highly interested in building your e-commerce platform. Based on our current discussion, we can definitely accommodate your timeline of ${lead.timeline} for ${lead.products}.\n\nLet's finalize this!`;
    await this.twilioAdapter.sendWhatsAppMessage(lead.phoneNumber, message);
  }

  async sendPostCallSummary(phoneNumber: string, summary: string): Promise<void> {
    const lead = await this.leadRepository.findByPhoneNumber(phoneNumber);
    if (!lead) return;

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const resumeUrl = `${baseUrl}/resume.pdf`;
    const architectureUrl = `${baseUrl}/architecture.png`;
    const devPhone = process.env.DEVELOPER_PHONE_NUMBER || '';

    const message = `Hi there, it was great speaking with you! Just to recap, I understand you are looking to build an e-commerce platform for ${lead.products} with ${lead.features}. You mentioned a budget of ${lead.budget} and a timeline of ${lead.timeline}, which we can absolutely accommodate.\n\nI built this entire AI system! You can reach me directly at ${devPhone}.\n\nHere is my resume: ${resumeUrl}`;

    await this.twilioAdapter.sendWhatsAppMessage(lead.phoneNumber, message, [architectureUrl, resumeUrl]);
  }
}

