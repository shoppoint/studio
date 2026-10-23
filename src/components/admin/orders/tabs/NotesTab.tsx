"use client";

import React from "react";
import { Info, ShieldCheck, Zap, Globe, Hash, Clock, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function NotesTab({ order, internalNotes, setInternalNotes, isEditMode }: any) {
  const isOnlinePayment = order?.paymentToken || order?.paymentNotifyUrl;

  return (
    <div className="space-y-10 animate-in fade-in">
      {/* 內部備註區域 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 ml-1 mb-2">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <Info className="h-5 w-5" />
          </div>
          <h4 className="font-black text-lg text-slate-800">內部備註 (Internal Notes)</h4>
        </div>
        <Textarea 
          value={internalNotes} 
          onChange={(e) => setInternalNotes(e.target.value)} 
          disabled={!isEditMode} 
          placeholder="在此記錄與訂單相關的內部事項（僅管理員可見）..."
          className="min-h-[300px] bg-muted/20 border-none rounded-[2.5rem] p-8 text-sm leading-relaxed shadow-inner focus-visible:ring-primary/20" 
        />
      </div>

      {/* 支付診斷資訊 (Payment Diagnostics) */}
      {isOnlinePayment && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-black text-lg text-slate-800 uppercase tracking-tight">支付診斷與回傳資訊</h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment System Diagnostics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-3xl bg-muted/10 border border-muted-foreground/10 overflow-hidden">
              <CardHeader className="bg-muted/20 py-4 px-6 border-b">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5" /> 支付憑證 (Identifiers)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Yedpay Token</p>
                  <p className="font-mono text-xs break-all bg-white p-3 rounded-xl border border-dashed text-slate-700">
                    {order.paymentToken || "---"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Notify URL (回傳網址)</p>
                  <p className="font-mono text-[10px] break-all bg-white p-3 rounded-xl border border-dashed text-primary font-bold">
                    {order.paymentNotifyUrl || "---"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl bg-indigo-50 border-2 border-dashed border-indigo-200 overflow-hidden">
              <CardHeader className="bg-indigo-100/50 py-4 px-6 border-b border-indigo-200/50">
                <CardTitle className="text-xs font-black uppercase text-indigo-700 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" /> Webhook 實時紀錄
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-800 uppercase">回傳日誌快照 (Logs)</span>
                  </div>
                  <div className="text-[11px] text-indigo-900 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-indigo-100 min-h-[100px] whitespace-pre-line italic">
                    {order.internalNotes?.includes("[Yedpay Webhook]") 
                      ? order.internalNotes.split("\n").filter((l:string) => l.includes("[Yedpay")).join("\n") 
                      : "尚未收到任何背景回傳訊號。"}
                  </div>
                  <div className="flex items-start gap-2 pt-2">
                    <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-indigo-600/80 leading-relaxed italic">
                      若付款成功但狀態未變，請核對上方 Notify URL 是否與 Firebase 控制台的 Webhook 觸發地址一致。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
