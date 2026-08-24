import dotenv from 'dotenv';
dotenv.config();

const dial = async () => {
  const targetNumber = process.env.DEVELOPER_PHONE_NUMBER || '+919016030308';
  const vapiApiKey = process.env.VAPI_API_KEY;

  if (!vapiApiKey) {
    console.error('VAPI_API_KEY is not set');
    return;
  }

  const vapiAgentConfig = JSON.parse(JSON.stringify(require('./infrastructure/config/vapiAgent.json')));

  // Inject the live webhook URL from BASE_URL env var at runtime
  const webhookUrl = `${process.env.BASE_URL}/api/webhooks/vapi`;
  vapiAgentConfig.model.tools.forEach((tool: any) => {
    if (tool.server) tool.server.url = webhookUrl;
  });

  console.log(`Dialing ${targetNumber} via Vapi (webhook: ${webhookUrl})...`);

  try {
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vapiApiKey}`,
      },
      body: JSON.stringify({
        phoneNumber: {
          twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER_FOR_CALLS || 'YOUR_TWILIO_NUMBER',
          twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
          twilioAuthToken: process.env.TWILIO_AUTH_TOKEN
        },
        customer: {
          number: targetNumber,
        },
        assistant: vapiAgentConfig,
      }),
    });

    const data = await response.json();
    console.log('Call Response:', data);
  } catch (err) {
    console.error('Error dialing:', err);
  }
};

dial();
