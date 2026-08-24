import { LeadService } from '../application/services/LeadService';
import { SQLiteLeadRepository } from '../infrastructure/adapters/SQLiteLeadRepository';
import { ITwilioAdapter } from '../application/services/ITwilioAdapter';

describe('LeadService', () => {
  let leadService: LeadService;
  let repo: SQLiteLeadRepository;
  let mockTwilioAdapter: ITwilioAdapter;

  beforeEach((done) => {
    // Use in-memory SQLite DB
    repo = new SQLiteLeadRepository(':memory:');
    
    mockTwilioAdapter = {
      sendWhatsAppMessage: jest.fn().mockResolvedValue(undefined),
    };

    leadService = new LeadService(repo, mockTwilioAdapter);

    // Give SQLite a small amount of time to run the CREATE TABLE query
    setTimeout(done, 50);
  });

  it('should create a new lead and NOT trigger mid-call WhatsApp if intent is Warm', async () => {
    await leadService.processLeadQualification(
      'whatsapp:+123',
      'Warm',
      '$500',
      'shoes',
      '1 month',
      'e-commerce'
    );

    const lead = await repo.findByPhoneNumber('whatsapp:+123');
    expect(lead).toBeDefined();
    expect(lead?.intent).toBe('Warm');
    expect(mockTwilioAdapter.sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it('should trigger mid-call WhatsApp if intent is Hot', async () => {
    await leadService.processLeadQualification(
      'whatsapp:+124',
      'Hot',
      '$5000',
      'electronics',
      'ASAP',
      'custom design'
    );

    const lead = await repo.findByPhoneNumber('whatsapp:+124');
    expect(lead).toBeDefined();
    expect(lead?.intent).toBe('Hot');
    expect(mockTwilioAdapter.sendWhatsAppMessage).toHaveBeenCalledTimes(1);
    expect(mockTwilioAdapter.sendWhatsAppMessage).toHaveBeenCalledWith(
      'whatsapp:+124',
      expect.stringContaining('ASAP')
    );
  });
});
