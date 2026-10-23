
"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Warehouse, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Info,
  Printer,
  ShieldCheck,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Separator } from "@/components/ui/separator";

export default function VendorOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useI18n();
  const orderId = params.orderId as string;

  // 模擬商店專屬的訂單數據 (僅含該商店產品)
  const order = useMemo(() => ({
    id: orderId,
    date: "2024-03-20 14:30",
    status: "processing",
    // 隱私保護：不提供顧客姓名、電話、地址
    customerRef: "CUST-****-9928", 
    items: [
      { id: 1, name: { en: "Wireless Earbuds Pro", zh: "無線藍牙耳機 Pro" }, sku: "W-ER-001", qty: 2, image: "https://picsum.photos/seed/p1/100/100" },
      { id: 4, name: { en: "Mechanical Keyboard", zh: "機械電競鍵盤" }, sku: "W-KB-023", qty: 1, image: "https://picsum.photos/seed/p4/100/100" }
    ],
    logisticsType: "Warehouse Consolidation", // 集中發貨模式
    hubInfo: {
      name: "SHOP POINT 主要物流中心 (Main Hub)",
      address: "新界葵涌科技大廈 1204 室 (Unit 1204, Tech Tower, Kwai Chung)",
      contact: "+852 2345 6789",
      instructions: "請在包裹外箱清楚標註訂單編號，以便倉庫人員進行集運處理。"
    }
  }), [orderId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><Clock className="mr-1 h-3 w-3" /> 準備配貨中</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><CheckCircle2 className="mr-1 h-3 w-3" /> 已送往倉庫</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
              {orderId}
              {getStatusBadge(order.status)}
            </h1>
            <p className="text-muted-foreground">訂單日期: {order.date}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> 列印備貨清單
          </Button>
        </div>
      </div>

      {/* Privacy Alert */}
      <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-blue-500">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-blue-900">個人資料保護提示</p>
            <p className="text-xs text-blue-800 leading-relaxed opacity-80">
              根據平台隱私政策，為了保障顧客私隱，此頁面已隱藏顧客的個人聯絡資料及最終送貨地址。請將貨品備妥後送往指定的 SHOP POINT 物流中心。
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Items to Pack */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                待配貨清單
              </CardTitle>
              <CardDescription>請準備以下屬於您商店的產品項目。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">產品</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right pr-6">數量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded bg-muted relative overflow-hidden shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={lang === 'en' ? item.name.en : item.name.zh} className="object-cover w-full h-full" />
                            ) : (
                              <div className="h-full w-full bg-slate-200" />
                            )}
                          </div>
                          <span className="font-bold text-sm">{lang === 'en' ? item.name.en : item.name.zh}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{item.sku}</TableCell>
                      <TableCell className="text-right pr-6 font-black text-lg">x {item.qty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Packing Notes */}
          <Card className="border-none shadow-sm bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                商家配貨備註
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "無特殊包裝要求。請確保產品外盒完好並附上原廠保用證（如適用）。"
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Hub Logistics */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm border-t-4 border-primary">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-primary" />
                送貨指引 (物流中心)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">收貨點</p>
                <p className="text-sm font-bold">{order.hubInfo.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">地址</p>
                <p className="text-sm leading-relaxed">{order.hubInfo.address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">聯絡電話</p>
                <p className="text-sm">{order.hubInfo.contact}</p>
              </div>
              <Separator />
              <div className="p-3 bg-primary/5 rounded-lg flex gap-3">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {order.hubInfo.instructions}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Anonymity Summary */}
          <Card className="border-none shadow-sm bg-muted/10">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">顧客識別參考</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">顧客 ID:</span>
                <span className="font-mono">{order.customerRef}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">收貨區域:</span>
                <span className="font-bold">香港 (集運派送)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
