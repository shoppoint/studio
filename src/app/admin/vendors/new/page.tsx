"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorFormContainer } from "@/components/admin/vendors/VendorFormContainer";

function NewVendorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 支援從「待建檔帳號」帶入初始資料
  const initialData = {
    email: searchParams.get('email') || "",
    linkedUserId: searchParams.get('uid') || "",
    name: searchParams.get('name') || "",
    status: "Active",
    commission: 10
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            建立新合作商店檔案
          </h1>
          <p className="text-muted-foreground">手動定義一個新的商家實體，並分配管理權限。</p>
        </div>
      </div>

      <VendorFormContainer mode="new" initialData={initialData} />
    </div>
  );
}

export default function NewVendorPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <NewVendorContent />
    </Suspense>
  );
}
