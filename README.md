# ElevateBox AI Voice Caller

A production-grade, multi-lingual (English, Hindi, Telugu) AI Voice Caller and Lead Qualification system built for ElevateBox.

## Features
- **AI Voice Agent**: Handles inbound/outbound calls using Vapi.ai.
- **Dynamic Lead Qualification**: Categorizes leads into Hot, Warm, or Cold based on intent, budget, and timeline.
- **Mid-Call WhatsApp Triggers**: Instantly messages 'Hot' leads via Twilio while they are still on the phone.
- **Hexagonal Architecture**: Clean separation of Domain, Application, and Infrastructure layers.
- **Security-First**: Webhook HMAC signature verification and Zod payload validation.

## Prerequisites
- Node.js v18+
- Twilio Account (for WhatsApp)
- Vapi.ai Account (for AI Voice Agent)

## Environment Variables
Copy `.env.example` to `.env` and configure:
```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
VAPI_API_KEY=your_vapi_key
VAPI_WEBHOOK_SECRET=your_webhook_secret
DEVELOPER_PHONE_NUMBER=whatsapp:+919016030308
BASE_URL=https://your-ngrok-url.ngrok-free.app
PORT=3000
```

## Running the Project
1. Install dependencies: `npm install`
2. Expose local server using Ngrok: `ngrok http 3000`
3. Update `src/infrastructure/config/vapiAgent.json` with your Ngrok URL.
4. Start the server: `npx tsx src/server.ts`
5. Initiate a call: `npx tsx src/dial.ts`

## Testing
Run the comprehensive test suite with coverage:
```
npm run test
```

## Architecture
See [architecture.md](./architecture.md) for the full Mermaid diagram of the system flow.
