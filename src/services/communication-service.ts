
import { 
  doc, 
  getDoc, 
  collection, 
  serverTimestamp,
  Firestore,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { getNotificationContext, replaceVariables, generateItemsTable } from '@/lib/comm/context-helpers';
import { renderEmailHtml } from '@/lib/comm/email-renderer';
import { sendEmailTransport } from '@/lib/comm/transporter';

/**
 * @fileOverview 全通路通訊核心調度服務 (Dispatcher) - 穩定版 (V20)
 * 修正：校正站內通知路徑為 /users/，並優化變數替換引擎，確保所有渠道內容均被正確渲染。
 */

export { renderEmailHtml as renderEmailTemplate, replaceVariables, generateItemsTable as generateItemsTableHtml };

/**
 * 核心：觸發自動通知
 */
export async function triggerNotification(
  db: Firestore, 
  event: string, 
  data: any, 
  lang: any,
  forceSend: boolean = false
) {
  const langStr = String(lang || 'zh-HK').toLowerCase();
  
  // 1. 智慧語言映射
  const isEn = langStr.startsWith('en');
  const templateLangKey = isEn ? 'en' : 'zh';
  
  const id = data.id || data.orderId || data.uid;
  
  // 2. 強化收件人偵測
  const recipientEmail = (
    data.email || 
    data.customerInfo?.email || 
    data.customer?.email || 
    data.customerInfo?.user_email
  )?.trim();

  const targetUserId = data.uid || data.customerId || data.userId || data.customer?.uid || data.customer?.id;

  if (forceSend && (!recipientEmail || !recipientEmail.includes('@'))) {
    return { success: false, message: `無法發送：找不到有效的收件人電郵地址 (${recipientEmail || '空'})。` };
  }

  try {
    const [commSnap, genSnap, tempSnap] = await Promise.all([
      getDoc(doc(db, 'config', 'communication')),
      getDoc(doc(db, 'config', 'general')),
      getDoc(doc(db, 'notification_templates', event))
    ]);

    const commConfig = commSnap.data();
    const genConfig = genSnap.data();
    const template = tempSnap.data();

    if (!template) {
      throw new Error(`Template '${event}' not defined in Firestore.`);
    }

    const content = template[templateLangKey] || template[lang] || template['zh'] || {};
    const activeChannels = template.activeChannels || [];

    if (!content.emailSubject && !content.inAppContent && forceSend) {
      return { success: false, message: `發送失敗：範本 '${event}' 中完全找不到符合的內容。` };
    }

    if (!activeChannels.length && !forceSend) {
      return { success: false, message: "No active channels configured for this event." };
    }

    const context = getNotificationContext(data, genConfig, langStr);

    // 1. 電郵渠道
    if (activeChannels.includes('email') || forceSend) {
      if (recipientEmail && recipientEmail.includes('@') && content.emailSubject) {
        const subject = replaceVariables(content.emailSubject || `Update from ${context.storeName}`, context);
        const finalHtml = renderEmailHtml(content.emailBlocks || [], context);
        
        await sendEmailTransport({ 
          db,
          to: recipientEmail,
          subject,
          html: finalHtml,
          config: commConfig?.email,
          bcc: commConfig?.email?.bccEmail,
          orderId: data.orderId || data.id || undefined,
          event
        });
      }
    }

    // 2. 站內鈴鐺渠道 (修正寫入路徑與變數渲染)
    if (activeChannels.includes('in_app') || forceSend) {
      if (targetUserId && (content.inAppTitle || content.inAppContent)) {
        // 核心修正：站內通知若使用 HTML 表單會很醜，若發現 itemsTable，建議在範本中使用 itemsList
        const renderedTitle = replaceVariables(content.inAppTitle || "重要通知", context);
        const renderedContent = replaceVariables(content.inAppContent || "您有一則新的系統訊息。", context);

        const notifData = {
          title: renderedTitle,
          content: renderedContent,
          type: event.includes('order') ? 'order' : event.includes('stock') ? 'stock' : 'system',
          actionUrl: data.orderId ? `/profile/orders/${data.orderId || data.id}` : data.id ? `/product/${data.id}` : `/profile`,
          isRead: false,
          createdAt: serverTimestamp()
        };
        
        // 核心修正：路徑必須為 users (複數)
        await addDoc(collection(db, 'users', targetUserId, 'notifications'), notifData);
      }
    }

    return { success: true };
  } catch (e: any) {
    console.error(`[CommService] Dispatch Failure:`, e.message);
    return { success: false, message: e.message };
  }
}

/**
 * 到貨通知自動批次處理
 */
export async function processBackInStock(db: Firestore, productId: string, productName: string, sku: string, stock: number) {
  const q = query(collection(db, 'stock_alerts'), where('productId', '==', productId), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  for (const alert of alerts) {
    await triggerNotification(db, 'back_in_stock', { ...alert, productName, sku, stock }, 'zh');
    await updateDoc(doc(db, 'stock_alerts', alert.id), {
      status: 'notified',
      notifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

/**
 * 測試通知發送
 */
export async function sendTestNotification(params: { db: Firestore, subject: string, blocks: any[], lang: string }) {
  const { db, subject, blocks, lang } = params;
  try {
    const commSnap = await getDoc(doc(db, 'config', 'communication'));
    const genSnap = await getDoc(doc(db, 'config', 'general'));

    const commConfig = commSnap.data();
    const testRecipient = commConfig?.email?.bccEmail || commConfig?.email?.user;

    if (!testRecipient) throw new Error("Test recipient missing in config.");

    const mockOrder = {
      id: "TEST-12345",
      orderId: "2024-TEST-001",
      createdAt: new Date(),
      customerInfo: { name: "Test User", email: testRecipient, phone: "+852 9123 4567" },
      subtotal: 1000,
      shippingFee: 30,
      discountAmount: 100,
      total: 930,
      paymentMethod: "Credit Card",
      shippingMethodName: "SF Express",
      selectedPoint: { 
        name_zh: "屯門分店自取點", 
        name_en: "Tuen Mun Branch Pickup", 
        code: "B17",
        address_zh: "香港新界屯門青菱徑 3 號時尚電腦城地庫 B17 號舖"
      },
      items: [{ name: "Test Product A", sku: "T-001", price: 1000, qty: 1 }],
      productName: "Test Product",
      newTier: "Gold",
      couponCode: "SAVE10"
    };

    const context = getNotificationContext(mockOrder, genSnap?.data() || {}, lang);
    const html = renderEmailHtml(blocks, context);
    
    return await sendEmailTransport({
      db,
      to: testRecipient,
      subject: `[TEST] ${subject}`,
      html,
      config: commConfig?.email,
      event: 'test_notification'
    });
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
