"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Youtube from "@tiptap/extension-youtube";

import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link as LinkIcon,
  Image as ImageIcon,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Table as TableIcon,
  SquarePlus,
  Trash2,
  Youtube as YoutubeIcon,
  Loader2,
  Upload
} from "lucide-react";
import { Button } from "./button";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useStorage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./separator";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "standard" | "minimal";
  uploadPath?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className, variant = "standard", uploadPath = "content/uploads" }: RichTextEditorProps) {
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      ImageExtension.configure({ 
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full h-auto my-4 border shadow-sm',
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4 border border-muted-foreground/20 rounded-lg overflow-hidden',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-muted/50 border border-muted-foreground/20 p-2 font-black',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-muted-foreground/20 p-2 min-w-[100px]',
        },
      }),
      Youtube.configure({
        width: 480,
        height: 320,
        HTMLAttributes: {
          class: 'aspect-video w-full rounded-2xl shadow-lg my-6',
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none bg-white rounded-b-xl border-x border-b transition-all",
          "prose-table:border-collapse prose-td:border prose-td:border-muted-foreground/20 prose-th:border prose-th:border-muted-foreground/20",
          variant === 'minimal' ? "min-h-[80px]" : "min-h-[300px]",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedBlob = await compressImage(file, 1200, 0.8);
      const fileName = `${uploadPath}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, compressedBlob);
      const url = await getDownloadURL(snapshot.ref);
      
      editor.chain().focus().setImage({ src: url }).run();
      toast({ title: "圖片已插入" });
    } catch (err) {
      toast({ title: "上傳失敗", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addYoutubeVideo = () => {
    const url = prompt('Enter YouTube URL');
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      });
    }
  };

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/30 border-b">
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}</Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={addYoutubeVideo}><YoutubeIcon className="h-4 w-4 text-red-600" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
      </div>
      <EditorContent editor={editor} className="p-4" />
    </div>
  );
}