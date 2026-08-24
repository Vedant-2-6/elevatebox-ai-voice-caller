import { Lead } from '../../domain/entities/Lead';

export interface ILeadRepository {
  save(lead: Lead): Promise<void>;
  findByPhoneNumber(phoneNumber: string): Promise<Lead | null>;
  update(lead: Lead): Promise<void>;
}
