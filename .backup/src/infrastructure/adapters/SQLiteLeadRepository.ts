import sqlite3 from 'sqlite3';
import { ILeadRepository } from '../../application/services/ILeadRepository';
import { Lead } from '../../domain/entities/Lead';

export class SQLiteLeadRepository implements ILeadRepository {
  private db: sqlite3.Database;

  constructor(dbPath: string = './database.sqlite') {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database', err.message);
      }
    });
    this.init();
  }

  private init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        phoneNumber TEXT UNIQUE,
        intent TEXT,
        budget TEXT,
        products TEXT,
        timeline TEXT,
        features TEXT,
        scheduledCallback TEXT,
        createdAt DATETIME,
        updatedAt DATETIME
      )
    `);
  }

  async save(lead: Lead): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO leads (id, phoneNumber, intent, budget, products, timeline, features, scheduledCallback, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lead.id,
          lead.phoneNumber,
          lead.intent,
          lead.budget,
          lead.products,
          lead.timeline,
          lead.features,
          lead.scheduledCallback,
          lead.createdAt.toISOString(),
          lead.updatedAt.toISOString(),
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Lead | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM leads WHERE phoneNumber = ?', [phoneNumber], (err, row: any) => {
        if (err) reject(err);
        else if (row) {
          resolve({
            id: row.id,
            phoneNumber: row.phoneNumber,
            intent: row.intent,
            budget: row.budget,
            products: row.products,
            timeline: row.timeline,
            features: row.features,
            scheduledCallback: row.scheduledCallback,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async update(lead: Lead): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE leads SET intent = ?, budget = ?, products = ?, timeline = ?, features = ?, scheduledCallback = ?, updatedAt = ? WHERE id = ?`,
        [
          lead.intent,
          lead.budget,
          lead.products,
          lead.timeline,
          lead.features,
          lead.scheduledCallback,
          lead.updatedAt.toISOString(),
          lead.id,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
