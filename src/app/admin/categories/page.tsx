"use client";

import { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Loader2,
  Package
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, doc, deleteDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name_en?: string;
  name_zh?: string;
  isVisible: boolean;
  parentId: string | null;
  displayOrder: number;
  children?: Category[];
}

export default function AdminCategories() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [catIdToDelete, setCatIdToDelete] = useState<string | null>(null);

  // 取得分類翻譯對象並加入保護，修復 TypeError
  const catT = t.admin?.categories || { 
    title: "分類設定", 
    subtitle: "管理全平台產品分類結構", 
    add_category: "新增分類",
    table: { name: "分類名稱", visibility: "顯示狀態", actions: "操作" }
  };

  // 監聽分類集合 - 加入 db 防禦性檢查
  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'categories'));
  }, [db]);

  const { data: rawCategories, loading } = useCollection<any>(categoriesQuery);

  const categories = useMemo(() => {
    if (!rawCategories) return [];
    
    const uniqueRawMap = new Map();
    rawCategories.forEach(item => {
      if (!uniqueRawMap.has(item.id)) {
        uniqueRawMap.set(item.id, item);
      }
    });
    const uniqueRaw = Array.from(uniqueRawMap.values());
    const sortedRaw = [...uniqueRaw].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const usedIds = new Set<string>();

    const buildHierarchy = (items: any[], parentId: string | null = "none"): Category[] => {
      return items
        .filter(item => {
          if (usedIds.has(item.id)) return false;
          const isTopLevelSearch = parentId === "none";
          const itemParent = item.parentId;
          
          if (isTopLevelSearch) {
            return !itemParent || itemParent === "none" || itemParent === "";
          }
          return itemParent === parentId;
        })
        .map(item => {
          usedIds.add(item.id);
          return {
            ...item,
            id: item.id,
            children: buildHierarchy(items, item.id)
          };
        });
    };

    return buildHierarchy(sortedRaw);
  }, [rawCategories]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const confirmDelete = async () => {
    if (!catIdToDelete) return;
    const id = catIdToDelete;
    // 立即重置狀態，確保遮罩移除
    setCatIdToDelete(null);

    try {
      await deleteDoc(doc(db, 'categories', id));
      toast({ title: "分類已移除", description: "Successfully deleted from Firestore." });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: `categories/${id}`,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  };

  const renderCategoryRow = (cat: Category, level: number = 0) => {
    const isExpanded = expanded[cat.id];
    const hasChildren = cat.children && cat.children.length > 0;
    
    const catName = lang === 'en' 
      ? (cat.name_en || cat.name_zh || "Untitled Category") 
      : (cat.name_zh || cat.name_en || "未命名分類");

    return (
      <Fragment key={cat.id}>
        <TableRow className="group hover:bg-muted/30">
          <TableCell className="w-12">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
          </TableCell>
          <TableCell style={{ paddingLeft: `${level * 24 + 12}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button onClick={() => toggleExpand(cat.id)} className="p-1 hover:bg-muted rounded transition-colors">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <span className={cn(
                level === 0 ? "font-bold text-base" : "font-medium text-sm", 
                cat.isVisible === false && "text-muted-foreground line-through"
              )}>
                {catName}
              </span>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="text-[10px] font-mono">Order: {cat.displayOrder || 0}</Badge>
          </TableCell>
          <TableCell>
            {cat.isVisible !== false ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 shadow-none h-6 px-3">
                <Eye className="mr-1 h-3 w-3" /> Visible
              </Badge>
            ) : (
              <Badge variant="secondary" className="opacity-60 h-6 px-3">
                <EyeOff className="mr-1 h-3 w-3" /> Hidden
              </Badge>
            )}
          </TableCell>
          <TableCell className="text-right space-x-2 pr-6">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
              <Link href={`/admin/categories/${cat.id}`}>
                <Edit2 className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-red-50" onClick={() => setCatIdToDelete(cat.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
        {isExpanded && hasChildren && cat.children?.map(child => renderCategoryRow(child, level + 1))}
      </Fragment>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{catT.title}</h1>
          <p className="text-muted-foreground">{catT.subtitle}</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-6" asChild>
          <Link href="/admin/categories/new">
            <Plus className="mr-2 h-4 w-4" /> {catT.add_category}
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Category Hierarchy (Firestore: shoppoint-hk)
          </CardTitle>
          <CardDescription>
            Manage multi-level sub-categories using flat field structure (name_en, name_zh).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground">Syncing with shoppoint-hk...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-20 text-center border-dashed border-2 m-6 rounded-2xl">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">No categories found in Firestore.</p>
              <Button variant="link" asChild className="text-primary mt-2">
                <Link href="/admin/categories/new">Create your first category</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>{catT.table?.name || "分類名稱"}</TableHead>
                  <TableHead>Sorting</TableHead>
                  <TableHead>{catT.table?.visibility || "顯示狀態"}</TableHead>
                  <TableHead className="text-right pr-6">{catT.table?.actions || "操作"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(cat => renderCategoryRow(cat))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Global Deletion Confirmation Dialog */}
      <AlertDialog open={!!catIdToDelete} onOpenChange={(open) => { if (!open) setCatIdToDelete(null); }}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline">確認刪除分類？</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
              此操作將永久移除該分類。如果有產品仍關聯在此分類下，建議先將產品移往其他類別。此操作不可撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold h-11" onClick={() => setCatIdToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold h-11 px-8" onClick={confirmDelete}>
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
