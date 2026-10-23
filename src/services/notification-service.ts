
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  limit,
  Firestore,
  writeBatch,
  doc,
  where
} from 'firebase/firestore';

export type NotificationType = 'order' | 'promo' | 'system';

interface SendNotificationParams {
  db: Firestore;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  actionUrl?: string;
  sendPush?: boolean;
}

/**
 * 發送通知給特定用戶
 */
export async function sendNotification({
  db,
  userId,
  title,
  content,
  type,
  actionUrl,
  sendPush = false
}: SendNotificationParams) {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      title,
      content,
      type,
      actionUrl: actionUrl || '',
      isRead: false,
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
}

/**
 * 通知全體管理人員
 */
export async function notifyStaff(db: Firestore, title: string, content: string, actionUrl?: string) {
  try {
    const globalNotifRef = collection(db, 'global_notifications');
    await addDoc(globalNotifRef, {
      title,
      content,
      type: 'system',
      actionUrl: actionUrl || '',
      isRead: false,
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('notifyStaff error:', error);
    return { success: false, error };
  }
}

/**
 * 廣播通知給所有用戶
 */
export async function broadcastNotification(db: Firestore, title: string, content: string, actionUrl?: string) {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef, limit(50)));
    
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(userDoc => {
      const newNotifRef = doc(collection(db, 'users', userDoc.id, 'notifications'));
      batch.set(newNotifRef, {
        title,
        content,
        type: 'system',
        actionUrl: actionUrl || '',
        isRead: false,
        createdAt: serverTimestamp()
      });
    });

    await batch.commit();
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return { success: false, error };
  }
}
