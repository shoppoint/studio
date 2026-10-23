"use client";

import { 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Loader2,
  Youtube,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { useStorage } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export function ProductMediaTab({ formData, onInputChange, productId }: any) {
  const { toast } = useToast();
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    const updatedImages = [...(formData.images || [])];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressedBlob = await compressImage(file, 1200, 0.75);
        const fileName = `products/${productId}/${Date.now()}_${i}.webp`;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            reject,
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              updatedImages.push({ url: downloadURL, isMain: updatedImages.length === 0, name: fileName });
              if (!formData.imageUrl) onInputChange("imageUrl", downloadURL);
              resolve();
            }
          );
        });
      } catch (err: any) { toast({ title: "Upload Error", description: err.message, variant: "destructive" }); }
    }
    onInputChange("images", updatedImages);
    setUploadProgress(0);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...formData.images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    onInputChange("images", newImages);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 border-b py-4 px-8 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">相簿與多媒體</CardTitle>
          <Button className="rounded-xl gap-2 font-black shadow-lg" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} 上載照片
          </Button>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {formData.images?.map((img: any, i: number) => (
              <div key={i} className={cn("relative aspect-square rounded-2xl border-2 overflow-hidden group transition-all", formData.imageUrl === img.url ? "border-primary ring-4 ring-primary/10 shadow-xl" : "border-muted hover:border-primary/20")}>
                {img.url && <img src={img.url} className="w-full h-full object-cover" alt="preview" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all">
                  <div className="flex items-center gap-1 mb-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => moveImage(i, 'left')} disabled={i === 0}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => moveImage(i, 'right')} disabled={i === formData.images.length - 1}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                  <Button size="sm" variant="secondary" className="h-7 text-[10px] font-black uppercase rounded-lg" onClick={() => onInputChange("imageUrl", img.url)}>設為主圖</Button>
                  <button onClick={() => onInputChange("images", formData.images.filter((_:any, idx:number) => idx !== i))} className="text-white hover:text-red-500 transition-colors"><Trash2 className="h-5 w-5" /></button>
                </div>
                {formData.imageUrl === img.url && <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg animate-in zoom-in">MAIN</div>}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full backdrop-blur-sm">{i + 1}</div>
              </div>
            ))}
            {formData.images?.length < 10 && (
              <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:border-primary transition-all group">
                <ImageIcon className="h-8 w-8 mb-2 opacity-20 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">上載圖片</span>
              </button>
            )}
          </div>
          
          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          
          {uploadProgress > 0 && (
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-primary"><span>Uploading to Storage...</span><span>{Math.round(uploadProgress)}%</span></div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          <Separator className="border-dashed" />

          {/* YouTube Video Section */}
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 ml-1">
              <Youtube className="h-4 w-4 text-red-600" /> YouTube 影片網址 (Video Showcase)
            </Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  value={formData.youtubeUrl || ""} 
                  onChange={(e) => onInputChange("youtubeUrl", e.target.value)}
                  className="h-12 bg-muted/20 border-none rounded-xl font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-2 italic px-1">
                  * 貼上完整的影片網址，系統會自動在產品主圖區域生成影片播放器。
                </p>
              </div>
              {formData.youtubeUrl && (
                <div className="h-12 w-20 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0 border border-red-100 shadow-inner">
                  <Play className="h-6 w-6" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
