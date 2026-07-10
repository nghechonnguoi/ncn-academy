import { NextResponse } from 'next/server';

export const maxDuration = 30;

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
    const body = await req.json();
    const { orderCode, amount, description, buyerName, buyerPhone } = body;

    if (!orderCode || !amount || !description) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin đơn hàng' },
        { status: 400, headers: corsHeaders }
      );
    }

    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      console.warn('PayOS keys not configured, returning mock QR data');
      // Return mock data for development / missing keys
      return NextResponse.json({
        success: true,
        data: {
          bin: 'OCB',
          accountNumber: '61666666',
          accountName: 'PHAM THI NGAN',
          amount: amount,
          description: description,
          orderCode: orderCode,
          checkoutUrl: null,
        }
      }, { headers: corsHeaders });
    }

    // Dynamically import @payos/node to avoid build issues if not installed
    let payos: any;
    try {
      const { PayOS } = await import('@payos/node' as any);
      payos = new PayOS({
        clientId,
        apiKey,
        checksumKey,
      });
    } catch {
      console.error('Failed to import @payos/node');
      return NextResponse.json(
        { success: false, error: 'PayOS module not available' },
        { status: 500, headers: corsHeaders }
      );
    }

    const paymentData = {
      orderCode: Number(orderCode),
      amount: Number(amount),
      description: String(description).substring(0, 25), // PayOS max 25 chars
      buyerName: buyerName || '',
      buyerPhone: buyerPhone || '',
      cancelUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ncn-academy-web.vercel.app',
      returnUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ncn-academy-web.vercel.app',
    };

    const checkoutData = await payos.paymentRequests.create(paymentData);

    return NextResponse.json({
      success: true,
      data: {
        bin: checkoutData.data?.bin,
        accountNumber: checkoutData.data?.accountNumber,
        accountName: checkoutData.data?.accountName,
        amount: checkoutData.data?.amount,
        description: checkoutData.data?.description,
        orderCode: checkoutData.data?.orderCode,
        checkoutUrl: checkoutData.data?.checkoutUrl,
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('PayOS create error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi tạo đơn hàng' },
      { status: 500, headers: corsHeaders }
    );
  }
}
