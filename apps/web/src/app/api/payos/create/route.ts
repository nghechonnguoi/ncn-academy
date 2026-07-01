import { NextResponse } from 'next/server';
const { PayOS } = require('@payos/node');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  // @ts-ignore
  const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID || 'dummy_client_id',
    process.env.PAYOS_API_KEY || 'dummy_api_key',
    process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key'
  );
  try {
    const body = await req.json();
    const { orderCode, amount, description, buyerName, buyerPhone, cancelUrl, returnUrl } = body;

    if (!orderCode || !amount || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    const paymentData = {
      orderCode,
      amount,
      description,
      buyerName: buyerName || '',
      buyerPhone: buyerPhone || '',
      cancelUrl: cancelUrl || 'https://quiz.nghechonnguoi.com',
      returnUrl: returnUrl || 'https://quiz.nghechonnguoi.com',
    };

    const checkoutData = await payos.createPaymentLink(paymentData);
    
    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutData.checkoutUrl,
      qrCode: checkoutData.qrCode, // Some versions of SDK return qrCode URL
      bin: checkoutData.bin,
      accountNumber: checkoutData.accountNumber,
      accountName: checkoutData.accountName,
      amount: checkoutData.amount,
      description: checkoutData.description,
      paymentLinkId: checkoutData.paymentLinkId
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Lỗi khi tạo link thanh toán PayOS:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500, headers: corsHeaders });
  }
}
