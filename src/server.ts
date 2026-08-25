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
import path from 'path';
app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, '../public/index.html')); });

// Dependency Injection
const dbPath = process.env.DATABASE_PATH || './database.sqlite';
const leadRepository = new SQLiteLeadRepository(dbPath);
const twilioAdapter = new TwilioAdapter();
const leadService = new LeadService(leadRepository, twilioAdapter);
const webhookController = new WebhookController(leadService);

// Routes
app.post('/api/webhooks/vapi', webhookController.handleVapiWebhook);

app.get('/api/leads', async (req, res) => { try { const leads = await leadRepository.findAll(); res.json(leads); } catch (e) { res.status(500).json({ error: 'Failed to fetch leads' }); } });

app.post('/api/dial', async (req, res) => {
  try {
    const targetNumber = req.body.phoneNumber || process.env.DEVELOPER_PHONE_NUMBER || '+918688664337';
    const cleanNumber = targetNumber.replace('whatsapp:', '');
    const vapiApiKey = process.env.VAPI_API_KEY;
    
    if (!vapiApiKey) {
      return res.status(500).json({ error: 'VAPI_API_KEY is not set' });
    }

    const fs = require('fs');
    const path = require('path');
    const agentConfigPath = path.join(process.cwd(), 'src/infrastructure/config/vapiAgent.json');
    const vapiAgentConfig = JSON.parse(fs.readFileSync(agentConfigPath, 'utf-8'));
    const webhookUrl = `${process.env.BASE_URL || 'https://elevatebox-ai-voice-caller-production.up.railway.app'}/api/webhooks/vapi`;
    vapiAgentConfig.model.tools.forEach((tool: any) => {
      if (tool.server) tool.server.url = webhookUrl;
    });

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vapiApiKey}`,
      },
      body: JSON.stringify({
        phoneNumber: {
          twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER_FOR_CALLS || '+16614511548',
          twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
          twilioAuthToken: process.env.TWILIO_AUTH_TOKEN
        },
        customer: { number: cleanNumber },
        assistant: vapiAgentConfig,
      }),
    });

    const data = await response.json();
    res.json({ success: true, call: data });
  } catch (error) {
    console.error('Error dialing:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

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





