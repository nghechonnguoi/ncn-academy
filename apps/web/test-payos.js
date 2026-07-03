const { PayOS } = require('@payos/node');
require('dotenv').config({ path: '.env.local' });

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || 'dummy_client_id',
  apiKey: process.env.PAYOS_API_KEY || 'dummy_api_key',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key'
});

async function run() {
  try {
    const paymentData = {
      orderCode: 123456,
      amount: 10000,
      description: "Test",
      buyerName: '',
      buyerPhone: '',
      cancelUrl: 'https://quiz.nghechonnguoi.com',
      returnUrl: 'https://quiz.nghechonnguoi.com',
    };
    console.log("Calling create...");
    const checkoutData = await payos.paymentRequests.create(paymentData);
    console.log("Success:", checkoutData);
  } catch (e) {
    console.error("Error occurred!");
    console.error(e.name, e.message);
    console.error(e.stack);
  }
}

run();
