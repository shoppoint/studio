
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Mail, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  Users, 
  BarChart3,
  Search,
  MoreVertical,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/i18n-context";

export default function EmailCampaignsPage() {
  const { t, lang } = useI18n();

  // 模擬已發送的活動歷史
  const campaigns = [
    { id: "CMP-001", title: "2024 復活節限時優惠", target: "All Authorized", sentAt: "2024-03-20 10:00", reach: 1420, openRate: "42%", status: "completed" },
    { id: "CMP-002", title: "新品牌入駐：Apple 產品全線上架", target: "Tech Interested", sentAt: "2024-03-15 14:30", reach: 850, openRate: "38%", status: "completed" },
    { id: "CMP-003", title: "您的購物車還有商品未結帳", target: "Cart Abandoners", sentAt: "2024-03-10 09:00", reach: 120, openRate: "65%", status: "completed" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">電郵宣傳中心</h1>
          <p className="text-muted-foreground">主動發送推廣郵件、新品消息或專屬優惠給您的訂閱者。</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-bold shadow-md h-11" asChild>
          <Link href="/admin/marketing/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            建立新宣傳活動
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">授權接收名單</p>
              <p className="text-xl font-black">12,405 人</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">本月已發送</p>
              <p className="text-xl font-black">18,240 封</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">平均開信率</p>
              <p className="text-xl font-black">34.2%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">發送歷史 (Campaign History)</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋活動標題..." className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">活動標題</TableHead>
                <TableHead>目標群體</TableHead>
                <TableHead>發送人數</TableHead>
                <TableHead>開信率</TableHead>
                <TableHead>日期</TableHead>
                <TableHead className="text-right pr-6">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-6 font-bold">{c.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">{c.target}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{c.reach.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-primary">{c.openRate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.sentAt}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
