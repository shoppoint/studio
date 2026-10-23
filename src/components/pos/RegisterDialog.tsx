
"use client";

import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RegisterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  locations: any[] | null;
  currentLocationId: string;
  setCurrentLocationId: (v: string) => void;
  openingFloat: string;
  setOpeningFloat: (v: string) => void;
  onConfirm: () => void;
}

/**
 * @fileOverview POS 開市對帳對話框 - 修正 SelectItem 空值崩潰問題
 */
export function RegisterDialog({
  isOpen, onOpenChange, locations, currentLocationId, setCurrentLocationId,
  openingFloat, setOpeningFloat, onConfirm
}: RegisterDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8 border-none shadow-2xl">
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-2xl font-black font-headline">開市對帳</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase ml-1">選擇營業分店</Label>
            <Select value={currentLocationId || "none"} onValueChange={(v) => setCurrentLocationId(v === "none" ? "" : v)}>
              <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl font-bold">
                <SelectValue placeholder="請選擇門市..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                <SelectItem value="none" className="italic opacity-50">未選擇 (Unassigned)</SelectItem>
                {locations?.map(l => (
                  <SelectItem value={l.id || 'none'} key={l.id}>{l.name_zh || l.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase ml-1">開市備用金 (Float)</Label>
            <Input type="number" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} className="h-12 bg-muted/30 border-none rounded-xl font-black text-xl text-primary" />
          </div>
          <Button className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-xl" onClick={onConfirm} disabled={!currentLocationId}>
            開啟收銀時段
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

