
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Search, 
  Folder, 
  Loader2, 
  ExternalLink,
  CheckCircle2,
  FileText,
  Clock,
  LayoutGrid,
  List as ListIcon,
  RefreshCcw,
  Copy,
  FolderOpen,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
  MousePointer2,
  Zap,
  Info,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useStorage, useFirestore } from "@/firebase";
import { 
  ref, 
  listAll, 
  getDownloadURL, 
  getMetadata, 
  deleteObject, 
  uploadBytesResumable,
  StorageReference
} from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MediaFile {
  name: string; 
  friendlyName: string;
  url: string;
  size: number;
  type: string;
  timeCreated: string;
  fullPath: string;
  storageRef: StorageReference;
  isUsed?: boolean;
  isDuplicate?: boolean;
}

const STORAGE_FOLDERS = [
  { id: "products", label: "產品圖片 (Products)", path: "products" },
  { id: "articles", label: "文章內容 (Articles)", path: "articles" },
  { id: "brands", label: "品牌標誌 (Brands)", path: "brands" },
  { id: "categories", label: "分類圖片 (Categories)", path: "categories" },
  { id: "promos", label: "宣傳橫幅 (Promos)", path: "promos" },
  { id: "config", label: "系統資產 (Site Assets)", path: "config" },
];

export default function MediaLibraryPage() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const storage = useStorage();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'used' | 'unused' | 'duplicates'>('all');
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const medT = t.admin.media;

  const fetchUsedUrls = async () => {
    const urls = new Set<string>();
    try {
      const prodSnap = await getDocs(collection(db, 'public_products'));
      prodSnap.forEach(doc => {
        const data = doc.data();
        if (data.imageUrl) urls.add(data.imageUrl);
        if (Array.isArray(data.images)) data.images.forEach((img: string) => urls.add(img));
      });

      const artSnap = await getDocs(collection(db, 'articles'));
      artSnap.forEach(doc => {
        const data = doc.data();
        if (data.coverImage) urls.add(data.coverImage);
      });

      const catSnap = await getDocs(collection(db, 'categories'));
      catSnap.forEach(doc => {
        const data = doc.data();
        if (data.imageUrl) urls.add(data.imageUrl);
      });

      const brandSnap = await getDocs(collection(db, 'brands'));
      brandSnap.forEach(doc => {
        const data = doc.data();
        if (data.logoUrl) urls.add(data.logoUrl);
      });

    } catch (e) {
      console.error("Error fetching usage data", e);
    }
    return urls;
  };

  const fetchFiles = async (path: string) => {
    setLoading(true);
    try {
      const usedUrls = await fetchUsedUrls();
      
      const listRecursive = async (storageRef: StorageReference): Promise<StorageReference[]> => {
        const result = await listAll(storageRef);
        let allFiles = [...result.items];
        
        const subFolderFiles = await Promise.all(
          result.prefixes.map(prefix => listRecursive(prefix))
        );
        
        return allFiles.concat(...subFolderFiles);
      };

      const listRef = ref(storage, path);
      const allItems = await listRecursive(listRef);
      
      const filePromises = allItems.map(async (item) => {
        const url = await getDownloadURL(item);
        const metadata = await getMetadata(item);
        const friendlyName = item.name.includes('_') ? item.name.split('_').slice(1).join('_') : item.name;

        const isUsed = Array.from(usedUrls).some(u => 
          (typeof u === 'string' && u.includes(encodeURIComponent(item.name))) || 
          u === url
        );

        return {
          name: item.name,
          friendlyName,
          url,
          size: metadata.size,
          type: metadata.contentType || "image/webp",
          timeCreated: metadata.timeCreated,
          fullPath: item.fullPath,
          storageRef: item,
          isUsed
        };
      });

      const resolvedFiles = await Promise.all(filePromises);
      const nameCounts: Record<string, number> = {};
      resolvedFiles.forEach(f => { nameCounts[f.friendlyName] = (nameCounts[f.friendlyName] || 0) + 1; });

      const finalFiles = resolvedFiles.map(f => ({
        ...f,
        isDuplicate: nameCounts[f.friendlyName] > 1
      })).sort((a, b) => new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime());

      setFiles(finalFiles);
    } catch (error: any) {
      toast({ title: "Fetch Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
    setSelectionMode(false);
    setSelectedPaths([]);
  }, [currentPath]);

  const handleDelete = async (file: MediaFile) => {
    try {
      await deleteObject(file.storageRef);
      setFiles(prev => prev.filter(f => f.fullPath !== file.fullPath));
      toast({ title: t.common.success, description: `檔案「${file.friendlyName}」已刪除。` });
    } catch (error: any) {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async (targetPaths?: string[]) => {
    const pathsToDelete = targetPaths || selectedPaths;
    if (pathsToDelete.length === 0) return;

    setIsBulkDeleting(true);
    let successCount = 0;
    
    const filesToDelete = files.filter(f => pathsToDelete.includes(f.fullPath));

    for (const file of filesToDelete) {
      try {
        await deleteObject(file.storageRef);
        successCount++;
      } catch (e) {
        console.error(`Failed to delete ${file.fullPath}`, e);
      }
    }

    toast({ 
      title: "批量刪除完成", 
      description: `成功從伺服器移除 ${successCount} 個檔案。`,
      variant: successCount > 0 ? "default" : "destructive"
    });

    setIsBulkDeleting(false);
    setSelectionMode(false);
    setSelectedPaths([]);
    fetchFiles(currentPath);
  };

  const handleDeleteAllUnusedAndRedundant = async () => {
    const targets = files.filter(f => !f.isUsed);
    const targetPaths = targets.map(f => f.fullPath);
    
    if (targetPaths.length === 0) {
      toast({ title: "無需清理", description: "目前目錄下沒有任何未使用或冗餘的檔案。" });
      return;
    }
    
    await handleBulkDelete(targetPaths);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    const file = selectedFiles[0];
    const storageRef = ref(storage, `${currentPath}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed',
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => { toast({ title: "Upload Error", variant: "destructive" }); setUploading(false); },
      async () => {
        await fetchFiles(currentPath);
        setUploading(false);
        uploadProgress === 0;
        toast({ title: "上傳成功" });
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    );
  };

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.friendlyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            f.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeFilter === 'used') return matchesSearch && f.isUsed;
      if (activeFilter === 'unused') return matchesSearch && !f.isUsed;
      if (activeFilter === 'duplicates') return matchesSearch && f.isDuplicate && !f.isUsed;
      return matchesSearch;
    });
  }, [files, searchQuery, activeFilter]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleSelectAll = () => {
    if (selectedPaths.length === filteredFiles.length) {
      setSelectedPaths([]);
    } else {
      setSelectedPaths(filteredFiles.map(f => f.fullPath));
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "網址已複製" });
    } catch (err) {
      console.error("Copy failed", err);
      toast({ title: "複製失敗", description: "請手動選取並複製網址。", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 pb-12 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">{medT.title}</h1>
          <p className="text-muted-foreground">管理雲端媒體資產。系統會自動核對分類、品牌、產品及文章的圖片引用。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => fetchFiles(currentPath)} className="rounded-xl h-11 gap-2 font-bold" disabled={loading}>
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            同步狀態
          </Button>
          <Button className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6 shadow-lg gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {medT.upload_btn}
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 space-y-6 sticky top-24">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {medT.folders}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {STORAGE_FOLDERS.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentPath(folder.path)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 px-4 rounded-2xl transition-all text-sm font-bold group",
                    currentPath === folder.path 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Folder className={cn("h-4 w-4", currentPath === folder.path ? "fill-current" : "text-muted-foreground")} />
                    {folder.label}
                  </div>
                  <ChevronRight className={cn("h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity", currentPath === folder.path && "opacity-100")} />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-blue-500 rounded-3xl">
            <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-blue-900 flex items-center gap-2"><Zap className="h-3 w-3" />智慧空間清理</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[11px] text-blue-800 leading-relaxed">
                系統將自動找出「未使用」及「重複且冗餘」的圖片。這能有效釋放 Cloud Storage 儲存空間。
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full h-10 rounded-xl bg-white border-blue-200 text-blue-700 font-bold gap-2 text-xs shadow-sm hover:bg-blue-600 hover:text-white transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                    一鍵清理冗餘及未使用圖片
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black font-headline text-destructive">確認徹底清理空間？</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="text-sm text-muted-foreground space-y-3 pt-2">
                        <p>此動作將會從目前目錄 <strong>({currentPath})</strong> 中：</p>
                        <ul className="list-disc ml-5 space-y-1 text-xs">
                          <li>永久刪除所有標註為「未使用」的檔案。</li>
                          <li>刪除所有「重複且未被任何產品/文章引用」的冗餘副本。</li>
                        </ul>
                        <p className="text-destructive font-bold pt-2">⚠️ 注意：此操作無法復原，請確保您已核對資料。</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-xl font-bold h-11">取消</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white rounded-xl font-bold h-11 px-8" onClick={() => handleDeleteAllUnusedAndRedundant()}>
                      確認清理
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          <div className="flex flex-col gap-4 sticky top-24 z-20 bg-background/80 backdrop-blur pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-sm border">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜尋檔名..." 
                  className="pl-10 h-11 bg-muted/20 border-none shadow-inner rounded-xl text-sm" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={selectionMode ? "default" : "outline"} 
                  size="sm" 
                  className={cn("rounded-xl h-11 font-bold px-5", selectionMode && "bg-indigo-600 hover:bg-indigo-700")}
                  onClick={() => { setSelectionMode(!selectionMode); setSelectedPaths([]); }}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  {selectionMode ? "退出模式" : "批次選取"}
                </Button>
                <div className="flex items-center bg-muted/30 p-1.5 rounded-xl gap-1 border">
                  <Button variant={viewMode === 'grid' ? "default" : "ghost"} size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                  <Button variant={viewMode === 'list' ? "default" : "ghost"} size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewMode('list')}><ListIcon className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            {selectionMode && (
              <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-indigo-200">
                    <Checkbox id="select-all" checked={selectedPaths.length === filteredFiles.length && filteredFiles.length > 0} onCheckedChange={toggleSelectAll} />
                    <Label htmlFor="select-all" className="text-xs font-black text-indigo-700 uppercase cursor-pointer">全選</Label>
                  </div>
                  <span className="text-sm font-bold text-indigo-900">已選取 {selectedPaths.length} 個檔案</span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="rounded-xl font-bold h-9 px-6 shadow-md" disabled={selectedPaths.length === 0 || isBulkDeleting}>
                      {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      刪除選取檔案
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[2rem]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black font-headline">確認批次刪除？</AlertDialogTitle>
                      <AlertDialogDescription>
                        您正準備從伺服器永久刪除 {selectedPaths.length} 個檔案。此動作無法復原。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl font-bold">取消</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-white rounded-xl font-bold" onClick={() => handleBulkDelete()}>確認刪除</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant={activeFilter === 'all' ? "default" : "ghost"} size="sm" className="rounded-full h-8 px-4 text-[10px] font-black uppercase tracking-widest" onClick={() => setActiveFilter('all')}>全部 ({files.length})</Button>
              <Button variant={activeFilter === 'used' ? "default" : "ghost"} size="sm" className="rounded-full h-8 px-4 text-[10px] font-black uppercase tracking-widest" onClick={() => setActiveFilter('used')}>使用中 ({files.filter(f => f.isUsed).length})</Button>
              <Button variant={activeFilter === 'unused' ? "default" : "ghost"} size="sm" className="rounded-full h-8 px-4 text-[10px] font-black uppercase tracking-widest" onClick={() => setActiveFilter('unused')}>未使用 ({files.filter(f => !f.isUsed).length})</Button>
              <Button variant={activeFilter === 'duplicates' ? "secondary" : "ghost"} size="sm" className="rounded-full h-8 px-4 text-[10px] font-black uppercase tracking-widest text-orange-600" onClick={() => setActiveFilter('duplicates')}>重複且未使用 ({files.filter(f => f.isDuplicate && !f.isUsed).length})</Button>
            </div>
          </div>

          <div className="pb-20">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">同步雲端狀態中...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="h-64 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-4 text-muted-foreground/50 bg-muted/10">
                <ImageIcon className="h-12 w-12" />
                <p className="text-sm font-bold">找不到相符的檔案</p>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" 
                  : "divide-y divide-dashed border rounded-3xl bg-white overflow-hidden"
              )}>
                {filteredFiles.map((file) => (
                  <MediaItem 
                    key={file.fullPath} 
                    file={file} 
                    viewMode={viewMode} 
                    selected={selectedPaths.includes(file.fullPath)}
                    selectionMode={selectionMode}
                    onToggleSelect={() => setSelectedPaths(prev => prev.includes(file.fullPath) ? prev.filter(p => p !== file.fullPath) : [...prev, file.fullPath])}
                    onDelete={() => handleDelete(file)}
                    onCopy={() => handleCopyUrl(file.url)}
                    formatSize={formatSize}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaItem({ file, viewMode, selected, selectionMode, onToggleSelect, onDelete, onCopy, formatSize }: any) {
  if (viewMode === 'grid') {
    return (
      <Card 
        className={cn(
          "group relative border-none shadow-sm hover:shadow-xl transition-all overflow-hidden bg-white rounded-2xl cursor-pointer",
          selected ? "ring-4 ring-indigo-600 ring-offset-2" : "ring-1 ring-muted"
        )}
        onClick={() => selectionMode && onToggleSelect()}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img 
            src={file.url} 
            alt={file.friendlyName} 
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" 
          />
          
          {selectionMode ? (
            <div className={cn("absolute inset-0 flex items-center justify-center transition-all", selected ? "bg-indigo-600/20" : "bg-black/10 group-hover:bg-black/20")}>
              <div className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all", selected ? "bg-indigo-600 border-indigo-600 text-white scale-110" : "bg-white/50 border-white shadow-lg")}>
                {selected && <Check className="h-5 w-5" strokeWidth={4} />}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); onCopy(); }}><Copy className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="destructive" className="h-9 w-9 rounded-full shadow-lg" onClick={e => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2rem]">
                  <AlertDialogHeader><AlertDialogTitle className="text-xl font-black">刪除檔案？</AlertDialogTitle><AlertDialogDescription className="text-sm">{file.isUsed ? "⚠️ 警告：此檔案正在被產品、文章、分類或品牌使用中！" : "確定要永久刪除此媒體檔案嗎？"}</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel className="rounded-xl font-bold">取消</AlertDialogCancel><AlertDialogAction className="bg-destructive rounded-xl font-bold" onClick={onDelete}>確認刪除</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
            {file.isUsed && <Badge className="bg-green-500 text-white border-none text-[8px] font-black h-4 px-1.5 uppercase shadow-sm">In Use</Badge>}
            {file.isDuplicate && <Badge className="bg-orange-500 text-white border-none text-[8px] font-black h-4 px-1.5 uppercase shadow-sm">Duplicate</Badge>}
          </div>
        </div>
        <div className="p-2.5">
          <p className="text-[10px] font-black truncate leading-tight mb-1" title={file.friendlyName}>{file.friendlyName}</p>
          <div className="flex justify-between items-center text-[8px] font-black uppercase text-muted-foreground opacity-60">
            <span>{formatSize(file.size)}</span>
            <span>{file.type.split('/')[1]}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div 
      className={cn(
        "p-4 flex items-center justify-between hover:bg-muted/10 transition-colors group cursor-pointer",
        selected ? "bg-indigo-50" : ""
      )}
      onClick={() => selectionMode && onToggleSelect()}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {selectionMode && <Checkbox checked={selected} className="rounded-md h-5 w-5" />}
        <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden shrink-0 border shadow-inner">
          <img src={file.url} alt={file.friendlyName} className="object-cover w-full h-full" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black truncate">{file.friendlyName}</p>
            {file.isUsed && <Badge className="bg-green-500/10 text-green-700 border-none text-[8px] h-4">IN USE</Badge>}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono truncate opacity-50">ID: {file.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-4">
        <Badge variant="outline" className="text-[10px] font-mono font-bold bg-white">{formatSize(file.size)}</Badge>
        {!selectionMode && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={(e) => { e.stopPropagation(); onCopy(); }}><Copy className="h-4 w-4" /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive" onClick={e => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem]">
                <AlertDialogHeader><AlertDialogTitle className="font-black">確認刪除？</AlertDialogTitle></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel className="rounded-xl font-bold">取消</AlertDialogCancel><AlertDialogAction className="bg-destructive rounded-xl font-bold" onClick={onDelete}>執行刪除</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}
