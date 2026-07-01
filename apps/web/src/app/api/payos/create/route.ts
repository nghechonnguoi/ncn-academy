import { NextResponse } from 'next/server';
import PayOS from '@payos/node';

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID || 'dummy_client_id',
  process.env.PAYOS_API_KEY || 'dummy_api_key',
  process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key'
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderCode, amount, description, buyerName, buyerPhone, cancelUrl, returnUrl } = body;

    if (!orderCode || !amount || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo link thanh toán PayOS:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
  }
}
