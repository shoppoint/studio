'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCcw, MessageCircle, Home } from 'lucide-react';

/**
 * Global Error Handler - 最終防禦頁面 (強制白色背景，防止面紗遮擋)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const whatsappUrl = "https://wa.me/85253252555";

  return (
    <html lang="zh-HK">
      <head>
        <title>System Error | SHOP POINT</title>
      </head>
      <body style={{
        fontFamily: 'sans-serif',
        backgroundColor: '#f8fafc',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '50px 30px',
          borderRadius: '40px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px auto',
            color: '#dc2626'
          }}>
            <AlertTriangle size={40} />
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 15px 0', color: '#1e293b' }}>系統發生關鍵錯誤</h1>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', marginBottom: '40px', fontWeight: '500' }}>
            應用程式遇到致命錯誤，無法繼續運行。如果您正在結帳，請不要擔心，您可以點擊下方按鈕聯絡 WhatsApp 客服人員為您手動下單。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={() => reset()} 
              style={{
                backgroundColor: '#FACC15',
                color: '#1a1a1a',
                fontWeight: '900',
                padding: '18px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 10px 15px -3px rgba(250, 204, 21, 0.3)',
                transition: 'transform 0.2s'
              }}
            >
              <RefreshCcw size={20} /> 重新載入應用程式
            </button>

            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#22c55e',
                color: '#ffffff',
                fontWeight: '900',
                padding: '18px',
                borderRadius: '20px',
                textDecoration: 'none',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)'
              }}
            >
              <MessageCircle size={20} /> WhatsApp 專人支援
            </a>

            <button 
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                fontWeight: '700',
                padding: '15px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '10px'
              }}
            >
              返回首頁
            </button>
          </div>

          {error.digest && (
            <p style={{ marginTop: '40px', fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace', letterSpacing: '1px' }}>
              ERROR_ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
