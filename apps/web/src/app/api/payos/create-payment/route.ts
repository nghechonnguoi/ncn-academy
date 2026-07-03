import { NextResponse } from 'next/server';
const PayOS = require('@payos/node');

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID || '',
  process.env.PAYOS_API_KEY || '',
  process.env.PAYOS_CHECKSUM_KEY || ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!process.env.PAYOS_CLIENT_ID) {
      return NextResponse.json({ error: 'PayOS config missing' }, { status: 500, headers: corsHeaders });
    }

    const orderCode = data.orderCode;
    const amount = data.amount;
    const description = data.description || `NCN ${orderCode}`;
    const returnUrl = data.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://ncn-academy-web.vercel.app'}`;
    const cancelUrl = data.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://ncn-academy-web.vercel.app'}`;

    const requestData = {
      orderCode: orderCode,
      amount: amount,
      description: description,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
    };

    const paymentLinkRes = await payos.createPaymentLink(requestData);
    
    return NextResponse.json({
      success: true,
      data: {
        bin: paymentLinkRes.bin,
        accountNumber: paymentLinkRes.accountNumber,
        accountName: paymentLinkRes.accountName,
        amount: paymentLinkRes.amount,
        description: paymentLinkRes.description,
        orderCode: paymentLinkRes.orderCode,
        paymentLinkId: paymentLinkRes.paymentLinkId,
        checkoutUrl: paymentLinkRes.checkoutUrl,
        qrCode: paymentLinkRes.qrCode
      }
    }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error("PayOS Create Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
