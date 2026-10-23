"use client";

import { Sparkles, LayoutGrid, Heart, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AGE_RANGES = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const INTEREST_CATS = ["Electronics", "Fashion", "Beauty", "Home", "Sports", "Food"];

export function ProfilePreferences({ 
  selectedInterests, setSelectedInterests, skinType, setSkinType, 
  ageRange, setAgeRange, onSave, loading, t, lang 
}: any) {
  const intT = t.profile.interests;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> {intT.title}
          </h2>
          <p className="text-sm text-muted-foreground">{intT.subtitle}</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-bold shadow-md rounded-xl" onClick={onSave} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} {t.common.save}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-primary" /> {intT.age_range}</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={ageRange} onValueChange={setAgeRange} className="grid grid-cols-2 gap-4">
              {AGE_RANGES.map((range) => (
                <div key={range} className="flex items-center space-x-2">
                  <RadioGroupItem value={range} id={`age-${range}`} />
                  <Label htmlFor={`age-${range}`} className="text-sm cursor-pointer">{range}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> {intT.categories}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {INTEREST_CATS.map((cat) => (
              <div key={cat} className="flex items-center space-x-2">
                <Checkbox 
                  id={`pref-${cat}`} 
                  checked={selectedInterests.includes(cat)} 
                  onCheckedChange={(checked) => { setSelectedInterests((prev:string[]) => checked ? [...prev, cat] : prev.filter(i => i !== cat)); }} 
                />
                <Label htmlFor={`pref-${cat}`} className="text-sm cursor-pointer">{cat}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {intT.skin_type}</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={skinType} onValueChange={setSkinType} className="grid grid-cols-2 gap-4">
              {["Dry", "Oily", "Combination", "Normal"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`skin-${type}`} />
                  <Label htmlFor={`skin-${type}`} className="text-sm cursor-pointer">{type}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex items-start gap-4 shadow-sm">
        <Sparkles className="h-6 w-6 text-primary shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="font-black text-sm text-primary uppercase">AI 個人化服務</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            我們致力於為您提供「非干擾性」的智能推薦。透過設定偏好，AI 將會在您的專屬 EDM 電子報及網站推薦區塊中，優先展示符合您興趣的優質好物。
          </p>
        </div>
      </div>
    </div>
  );
}
