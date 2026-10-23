
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/index';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview 訂單狀態校對接口
 * 供成功頁面主動拉取最新狀態，解決 Webhook 延遲問題。
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ success: false, message: "Missing Order ID" }, { status: 400 });
  }

  try {
    const { db } = initializeFirebase();
    const orderSnap = await getDoc(doc(db, 'orders', orderId));

    if (!orderSnap.exists()) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const data = orderSnap.data();
    return NextResponse.json({
      success: true,
      paymentStatus: data.paymentStatus || 'unpaid',
      status: data.status || 'pending'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
