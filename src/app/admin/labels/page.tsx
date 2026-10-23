"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Printer, 
  Search, 
  Package, 
  Tag, 
  ArrowLeft, 
  Loader2, 
  LayoutGrid,
  CheckCircle2,
  X,
  Plus,
  Filter,
  Info,
  ChevronLeft,
  ChevronRight,
  Check,
  Zap,
  Type,
  Coins,
  Settings2,
  Trash2,
  Copy,
  FilePlus2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type LabelSize = '6x4' | '8x4' | '6.7x3';

interface ItemConfig {
  id: string;
  name: string;
  sku: string;
  brand: string;
  originalPrice: number;
  salePrice: number;
  printPrice: string;
  marketingLabel: string;
  imageUrl?: string;
  isBlank?: boolean;
}

export default function PriceTagGeneratorPage() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [labelSize, setLabelSize] = useState<LabelSize>("6x4");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [itemsConfig, setItemsConfig] = useState<Record<string, ItemConfig>>({});

  // Fetch Products
  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      orderBy('productName_zh')
    );
  }, [db]);
  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'categories'),
      orderBy('displayOrder', 'asc')
    );
  }, [db]);
  const { data: categories } = useCollection<any>(categoriesQuery);

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    const buildFlatTree = (list: any[], parentId: string | null = "none", depth = 0): any[] => {
      let results: any[] = [];
      const children = list.filter(c => (c.parentId || "none") === parentId);
      children.forEach(child => {
        results.push({ ...child, depth });
        results = [...results, ...buildFlatTree(list, child.id, depth + 1)];
      });
      return results;
    };
    return buildFlatTree(categories);
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const name = (p.productName_zh || "") + (p.productName_en || "") + (p.sku || "");
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const pCats = Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []);
      const matchesCategory = selectedCategoryId === "all" || pCats.includes(selectedCategoryId);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const toggleProduct = (p: any) => {
    setItemsConfig(prev => {
      const next = { ...prev };
      if (next[p.id]) {
        delete next[p.id];
      } else {
        next[p.id] = {
          id: p.id,
          name: p.productName_zh || p.productName_en,
          sku: p.sku || "--",
          brand: p.brands || p.primaryBrand || "",
          originalPrice: p.price,
          salePrice: p.salePrice,
          printPrice: (p.salePrice > 0 ? p.salePrice : p.price).toString(),
          marketingLabel: "",
          imageUrl: p.imageUrl
        };
      }
      return next;
    });
  };

  const addBlankTag = () => {
    const id = `blank_${Date.now()}`;
    setItemsConfig(prev => ({
      ...prev,
      [id]: {
        id,
        name: "",
        sku: "",
        brand: "",
        originalPrice: 0,
        salePrice: 0,
        printPrice: "",
        marketingLabel: "",
        imageUrl: "",
        isBlank: true
      }
    }));
  };

  const updateItemField = (id: string, field: keyof ItemConfig, value: string) => {
    setItemsConfig(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const selectedIds = useMemo(() => Object.keys(itemsConfig), [itemsConfig]);

  const handlePrint = () => {
    const selectedList = Object.values(itemsConfig);
    if (selectedList.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dimensions = {
      '6x4': { w: '6cm', h: '4cm', p: '2mm' },
      '8x4': { w: '8cm', h: '4cm', p: '3mm' },
      '6.7x3': { w: '6.7cm', h: '3cm', p: '1.5mm' }
    }[labelSize];

    const tagsHtml = selectedList.map(item => {
      const displayPrice = item.printPrice ? parseFloat(item.printPrice).toFixed(1) : "";
      const hasDiscount = !item.isBlank && item.salePrice > 0 && item.originalPrice > item.salePrice;
      
      return `
        <div class="tag price-tag" style="width: ${dimensions.w}; height: ${dimensions.h}; padding: ${dimensions.p};">
          <div class="brand">${(item.brand || '&nbsp;').toUpperCase()}</div>
          <div class="name">${item.name || '&nbsp;'}</div>
          <div class="footer">
            <div class="marketing-box">
              ${item.marketingLabel ? `<span class="marketing-text">${item.marketingLabel}</span>` : ''}
              ${hasDiscount ? `<div class="old-price">$ ${Number(item.originalPrice).toFixed(1)}</div>` : ''}
            </div>
            <div class="price-block">
              <span class="currency">HK$</span>
              <span class="amount">${displayPrice || '&nbsp;'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>SHOP POINT Labels</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans+HK:wght@400;700;900&display=swap');
            body { margin: 0; padding: 1cm; background: #fff; font-family: 'Inter', 'Noto Sans HK', sans-serif; }
            .print-grid { display: flex; flex-wrap: wrap; gap: 4px; }
            .tag { 
              border: 1px solid #000; 
              display: flex; 
              flex-direction: column; 
              overflow: hidden; 
              position: relative; 
              background: #fff;
              box-sizing: border-box;
              break-inside: avoid;
            }
            .price-tag .brand { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #555; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 2px; }
            .price-tag .name { font-weight: 900; line-height: 1.1; flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 14px; padding: 4px; }
            .price-tag .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1.5px dashed #000; padding-top: 4px; }
            .price-tag .marketing-text { font-size: 14px; font-weight: 900; display: block; }
            .price-tag .old-price { font-size: 9px; text-decoration: line-through; color: #666; }
            .price-tag .amount { font-size: 32px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; }
            .price-tag .currency { font-size: 10px; font-weight: 900; margin-right: 2px; }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="print-grid">${tagsHtml}</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href="/admin/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
           <div>
            <h1 className="text-3xl font-black font-headline tracking-tight">價錢牌生成器</h1>
            <p className="text-muted-foreground">針對零售門市設計，支援多種尺寸熱感貼紙一鍵生成。</p>
          </div>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-14 px-10 gap-2 hover:scale-105 transition-transform" disabled={selectedIds.length === 0} onClick={() => setIsPreviewOpen(true)}>
          <Printer className="h-5 w-5" />
          進入列印預覽 ({selectedIds.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Product Selector */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="搜尋產品名稱或 SKU..." className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Button variant="outline" className="h-11 rounded-xl font-black gap-2 border-primary/20 text-primary bg-white shadow-sm shrink-0" onClick={addBlankTag}>
                  <FilePlus2 className="h-4 w-4" /> 空白
                </Button>
              </div>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="h-10 bg-white rounded-xl font-bold text-xs"><div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5 text-primary" /><SelectValue placeholder="所有分類" /></div></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl max-h-80">
                  <SelectItem value="all" className="font-black text-primary">所有產品類別</SelectItem>
                  <Separator className="my-1" />
                  {categoryOptions.map(cat => <SelectItem key={cat.id} value={cat.id}><span className="flex items-center gap-1">{Array(cat.depth).fill("—").join("")}{cat.depth > 0 && " "}{getCatName(cat)}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {productsLoading ? <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div> : (
                  <div className="divide-y divide-dashed">
                    {filteredProducts.map((p) => (
                      <div key={p.id} className={cn("flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group", itemsConfig[p.id] && "bg-primary/5")} onClick={() => toggleProduct(p)}>
                        <div className="flex items-center gap-4">
                          <Checkbox checked={!!itemsConfig[p.id]} onCheckedChange={() => {}} className="rounded-full" />
                          <div className="h-10 w-10 rounded-lg bg-muted border overflow-hidden shrink-0">{p.imageUrl ? <img src={p.imageUrl} className="object-cover w-full h-full" /> : <Package className="h-4 w-4 m-3 opacity-20" />}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate leading-tight">{p.productName_zh || p.productName_en}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-[8px] font-mono h-4">{p.sku}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900">${p.salePrice || p.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: Customization */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white border-l-4 border-black">
            <CardHeader className="bg-muted/10 border-b py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> 標籤尺寸與設定
              </CardTitle>
              <div className="flex gap-1">
                {['6x4', '8x4', '6.7x3'].map(size => (
                  <Button key={size} variant={labelSize === size ? "default" : "ghost"} size="sm" className="h-7 text-[10px] font-black rounded-lg" onClick={() => setLabelSize(size as any)}>{size}cm</Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-6">
               <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4 shadow-sm">
                  <div className="h-10 w-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm"><Info className="h-5 w-5" /></div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900 uppercase">標籤排版說明</p>
                    <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                      系統將自動提取品牌、名稱及售價。您可以手動修改每個標籤的內容或加入特殊的行銷標語（如：試食價、會員價）。
                    </p>
                  </div>
               </div>
            </CardContent>
          </Card>

          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> 
            待印清單 ({selectedIds.length})
          </h3>

          <ScrollArea className="h-[600px] pr-2">
            <div className="space-y-4">
              {selectedIds.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed rounded-3xl bg-muted/10 opacity-40">
                  <Type className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm font-bold">請在左側選取產品</p>
                </div>
              ) : (
                selectedIds.map(id => {
                  const item = itemsConfig[id];
                  return (
                    <Card key={id} className="border-none shadow-md bg-white rounded-3xl overflow-hidden animate-in slide-in-from-right-2">
                      <div className="bg-muted/30 p-4 border-b flex justify-between items-center px-6">
                         <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-lg bg-white border p-1">
                             {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-contain" /> : <Package className="h-4 w-4 m-1 opacity-20" />}
                           </div>
                           <span className="text-xs font-black truncate max-w-[250px]">{item.name || "空白項目"}</span>
                         </div>
                         <button onClick={() => setItemsConfig(prev => { const next = {...prev}; delete next[id]; return next; })} className="text-muted-foreground hover:text-destructive">
                           <Trash2 className="h-4 w-4" />
                         </button>
                      </div>
                      <CardContent className="p-6 grid grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase opacity-60">品牌 (Brand)</Label><Input value={item.brand} onChange={e => updateItemField(id, 'brand', e.target.value)} className="h-9 bg-muted/10 border-none rounded-xl text-xs font-bold" /></div>
                            <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase opacity-60">名稱 (Name)</Label><Input value={item.name} onChange={e => updateItemField(id, 'name', e.target.value)} className="h-9 bg-muted/10 border-none rounded-xl text-xs font-bold" /></div>
                         </div>
                         <div className="space-y-4">
                            <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-primary">行銷文字</Label><Input value={item.marketingLabel} onChange={e => updateItemField(id, 'marketingLabel', e.target.value)} className="h-9 border-primary/20 rounded-xl text-xs font-bold" placeholder="如：試食價" /></div>
                            <div className="grid gap-2">
                               <Label className="text-[9px] font-black uppercase text-orange-600">列印售價 ($)</Label>
                               <div className="relative"><span className="absolute left-3 top-2.5 text-[10px] font-black opacity-40">$</span><Input type="number" value={item.printPrice} onChange={e => updateItemField(id, 'printPrice', e.target.value)} className="h-10 pl-6 bg-muted/20 border-none rounded-xl font-black text-orange-600 text-lg" /></div>
                            </div>
                         </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[1000px] p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-white border-b shrink-0 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-black font-headline">列印最終預覽</DialogTitle>
              <DialogDescription>尺寸：{labelSize}cm</DialogDescription>
            </div>
            <Button onClick={handlePrint} className="bg-black text-white font-black px-10 h-14 rounded-2xl shadow-xl gap-2 active:scale-95 transition-all">
              <Printer className="h-6 w-6" /> 確認並列印
            </Button>
          </DialogHeader>
          <ScrollArea className="flex-1 bg-slate-100 p-8 h-[70vh]">
            <div className="bg-white mx-auto shadow-2xl p-[1cm] flex flex-wrap gap-3 justify-start content-start" style={{ width: '21cm', minHeight: '29.7cm' }}>
              {Object.values(itemsConfig).map((item) => (
                <LabelItem 
                  key={item.id} 
                  item={item} 
                  size={labelSize} 
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LabelItem({ item, size }: { item: ItemConfig, size: LabelSize }) {
  const dimensions = {
    '6x4': { w: '6cm', h: '4cm', padding: '1mm' },
    '8x4': { w: '8cm', h: '4cm', padding: '1.5mm' },
    '6.7x3': { w: '6.7cm', h: '3cm', padding: '1mm' }
  }[size];

  const priceStr = item.printPrice?.toString().trim() || "";
  const displayPrice = priceStr === "" ? "" : parseFloat(priceStr).toFixed(1);
  const hasDiscount = !item.isBlank && item.originalPrice > item.salePrice && item.salePrice > 0;

  return (
    <div className="bg-white border-2 border-black flex flex-col justify-between overflow-hidden relative break-inside-avoid shadow-none" style={{ width: dimensions.w, height: dimensions.h, padding: '2mm' }}>
      <div className="text-[10px] font-black uppercase text-slate-500 tracking-[0.1em] text-center mb-1 truncate border-b border-muted pb-1">
        {item.brand || "\u00A0"}
      </div>
      <div className="font-black leading-[1.2] flex-1 flex items-center justify-center text-center px-1 text-black text-sm">
        <span className="line-clamp-3">{item.name || "空白項目"}</span>
      </div>
      <div className="flex justify-between items-end mt-2 pt-2 border-t-2 border-dashed border-black">
        <div className="space-y-0.5 flex-shrink-0 flex flex-col justify-end">
          {item.marketingLabel ? <div className="font-black text-lg uppercase text-black leading-none mb-1">{item.marketingLabel}</div> : null}
          {hasDiscount && <div className="text-[10px] line-through text-slate-400 font-bold decoration-black decoration-1">$ {Number(item.originalPrice).toFixed(1)}</div>}
        </div>
        <div className="text-right leading-none ml-2">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-[10px] font-black uppercase">HK$</span>
            <span className="font-black tracking-tighter text-black inline-block min-w-[2.5em] text-right text-4xl">
              {displayPrice || "\u00A0"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
