import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { SQLiteLeadRepository } from './infrastructure/adapters/SQLiteLeadRepository';
import { TwilioAdapter } from './infrastructure/adapters/TwilioAdapter';
import { LeadService } from './application/services/LeadService';
import { WebhookController } from './infrastructure/controllers/WebhookController';

dotenv.config();

const app = express();

// Trust proxy for Railway so rate limiting works correctly
app.set('trust proxy', 1);

// Apply Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

app.use(cors());
app.use(express.json());

// Serve static files for WhatsApp media URLs (resume, architecture diagram)
app.use(express.static('public'));

// Dependency Injection
const dbPath = process.env.DATABASE_PATH || './database.sqlite';
const leadRepository = new SQLiteLeadRepository(dbPath);
const twilioAdapter = new TwilioAdapter();
const leadService = new LeadService(leadRepository, twilioAdapter);
const webhookController = new WebhookController(leadService);

// Routes
app.post('/api/webhooks/vapi', webhookController.handleVapiWebhook);

app.get('/api/leads', async (req, res) => { try { const leads = await leadRepository.findAll(); res.json(leads); } catch (e) { res.status(500).json({ error: 'Failed to fetch leads' }); } });

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err.message || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}



