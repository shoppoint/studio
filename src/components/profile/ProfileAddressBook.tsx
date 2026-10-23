
"use client";

import { useState, useMemo } from "react";
import { MapPin, Plus, Loader2, Home as HomeIcon, Globe, Edit2, Trash2, Mail, Phone, Save, CheckCircle2, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { HK_ADDRESS_DATA, COUNTRIES, COUNTRY_NAME_MAP, AREA_NAME_MAP, DISTRICT_NAME_MAP, SUB_DISTRICT_NAME_MAP } from "@/lib/address-data";

export function ProfileAddressBook({ user, addresses, loading, onSave, onDelete, t, lang }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isZh = lang === 'zh-HK';

  const [form, setForm] = useState<any>({
    firstName: "", lastName: "", companyName: "", email: "", phone: "", country: "Hong Kong",
    flat: "", floor: "", block: "", building: "", street: "",
    subDistrict: "", district: "", area: "", city: "", state: "", postalCode: "",
    isDefault: false
  });

  const districtOptions = useMemo(() => 
    form.area && HK_ADDRESS_DATA[form.area] ? Object.keys(HK_ADDRESS_DATA[form.area]) : []
  , [form.area]);

  const subDistrictOptions = useMemo(() => 
    form.area && form.district && HK_ADDRESS_DATA[form.area] && HK_ADDRESS_DATA[form.area][form.district] 
      ? HK_ADDRESS_DATA[form.area][form.district] 
      : []
  , [form.area, form.district]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ 
      firstName: "", lastName: "", companyName: "", email: user?.email || "", phone: "", 
      country: "Hong Kong", flat: "", floor: "", block: "", building: "", street: "", 
      subDistrict: "", district: "", area: "", city: "", state: "", postalCode: "", 
      isDefault: !addresses || addresses.length === 0 
    });
    setIsOpen(true);
  };

  const openEdit = (addr: any) => {
    setEditingId(addr.id);
    setForm({ ...addr });
    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    await onSave(editingId, form);
    setIsSubmitting(false);
    setIsOpen(false);
  };

  const addrT = t.checkout.address_fields;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> {t.profile.address_title}
          </h2>
          <p className="text-sm text-muted-foreground">{lang === 'en' ? 'Manage your shipping destinations.' : '管理您的收貨目的地。'}</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-6 gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t.profile.add_address}
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (!addresses || addresses.length === 0) ? (
        <Card className="border-2 border-dashed bg-muted/5 rounded-[2rem] p-12 text-center space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground font-medium">{t.profile.no_addresses}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr: any) => (
            <Card key={addr.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all">
              <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  {addr.country === 'Hong Kong' ? <HomeIcon className="h-4 w-4 text-primary" /> : <Globe className="h-4 w-4 text-blue-500" />}
                  {isZh ? (COUNTRY_NAME_MAP[addr.country] || addr.country) : addr.country}
                </CardTitle>
                {addr.isDefault && <Badge className="bg-primary text-primary-foreground text-[8px] font-black h-5 uppercase">DEFAULT</Badge>}
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="font-bold">{addr.lastName} {addr.firstName}</p>
                  {addr.companyName && <p className="text-xs font-bold text-primary flex items-center gap-1"><Building2 className="h-3 w-3" /> {addr.companyName}</p>}
                  <p className="text-xs text-muted-foreground font-medium">{addr.email}</p>
                  <p className="text-xs text-muted-foreground font-medium">{addr.phone}</p>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {addr.country === 'Hong Kong' ? (
                    <>
                      <p>{addr.flat && `${addr.flat}, `}{addr.floor && `${addr.floor}/F, `}{addr.block && `Block ${addr.block}`}</p>
                      <p>{addr.building}</p><p>{addr.street}</p>
                      <p className="font-bold text-foreground">
                        {isZh ? (SUB_DISTRICT_NAME_MAP[addr.subDistrict] || addr.subDistrict) : addr.subDistrict}, {isZh ? (DISTRICT_NAME_MAP[addr.district] || addr.district) : addr.district}, {isZh ? (AREA_NAME_MAP[addr.area] || addr.area) : addr.area}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>{addr.street}</p>{addr.building && <p>{addr.building}</p>}
                      <p className="font-bold text-foreground">{addr.city}, {addr.state} {addr.postalCode}</p>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/5 border-t p-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold gap-1.5" onClick={() => openEdit(addr)}><Edit2 className="h-3 w-3" /> {t.common.edit}</Button>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-destructive hover:bg-red-50 gap-1.5" onClick={() => onDelete(addr.id)}><Trash2 className="h-3 w-3" /> {t.common.delete}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-primary-foreground">
            <DialogTitle className="text-2xl font-black font-headline">{editingId ? t.profile.edit_address : t.profile.add_address}</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">提供精確的配送資訊以優化結帳體驗。</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="p-8 space-y-6 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.last_name}</Label><Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="bg-white border-none rounded-xl h-11 font-bold" /></div>
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.first_name}</Label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="bg-white border-none rounded-xl h-11 font-bold" /></div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase flex items-center gap-2">
                  <Building2 className="h-3 w-3 text-primary" />
                  公司名稱 (Company Name)
                </Label>
                <Input value={form.companyName || ""} onChange={e => setForm({...form, companyName: e.target.value})} className="bg-white border-none rounded-xl h-11 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.email}</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-white border-none rounded-xl h-11 font-bold" /></div>
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.phone}</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-white border-none rounded-xl h-11 font-bold" /></div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase">{addrT.country}</Label>
                <Select value={form.country} onValueChange={v => setForm({...form, country: v})}>
                  <SelectTrigger className="bg-white border-none h-11 rounded-xl">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{isZh ? (COUNTRY_NAME_MAP[c] || c) : c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {form.country === 'Hong Kong' ? (
                <div className="grid gap-6">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-1.5"><Label className="text-[9px] font-black text-muted-foreground uppercase">{addrT.flat}</Label><Input value={form.flat} onChange={e => setForm({...form, flat: e.target.value})} className="h-10 bg-white border-none rounded-xl text-center" /></div>
                    <div className="grid gap-1.5"><Label className="text-[9px] font-black text-muted-foreground uppercase">{addrT.floor}</Label><Input value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} className="h-10 bg-white border-none rounded-xl text-center" /></div>
                    <div className="grid gap-1.5"><Label className="text-[9px] font-black text-muted-foreground uppercase">{addrT.block}</Label><Input value={form.block} onChange={e => setForm({...form, block: e.target.value})} className="h-10 bg-white border-none rounded-xl text-center" /></div>
                  </div>
                  <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.building}</Label><Input value={form.building} onChange={e => setForm({...form, building: e.target.value})} className="h-11 bg-white border-none rounded-xl" /></div>
                  <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.street}</Label><Input value={form.street} onChange={e => setForm({...form, street: e.target.value})} className="h-11 bg-white border-none rounded-xl" /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-1.5">
                      <Label className="text-[9px] font-black uppercase">{addrT.area}</Label>
                      <Select value={form.area} onValueChange={v => setForm({...form, area: v, district: "", subDistrict: ""})}>
                        <SelectTrigger className="h-9 rounded-lg">
                          <SelectValue placeholder="Area" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(HK_ADDRESS_DATA).map(a => (
                            <SelectItem key={a} value={a}>{isZh ? (AREA_NAME_MAP[a] || a) : a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[9px] font-black uppercase">{addrT.district}</Label>
                      <Select value={form.district} onValueChange={v => setForm({...form, district: v, subDistrict: ""})} disabled={!form.area}>
                        <SelectTrigger className="h-9 rounded-lg">
                          <SelectValue placeholder="Dist" />
                        </SelectTrigger>
                        <SelectContent>
                          {districtOptions.map(d => (
                            <SelectItem key={d} value={d}>{isZh ? (DISTRICT_NAME_MAP[d] || d) : d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[9px] font-black uppercase">{addrT.sub_district}</Label>
                      <Select value={form.subDistrict} onValueChange={v => setForm({...form, subDistrict: v})} disabled={!form.district}>
                        <SelectTrigger className="h-9 rounded-lg">
                          <SelectValue placeholder="Sub" />
                        </SelectTrigger>
                        <SelectContent>
                          {subDistrictOptions.map(s => (
                            <SelectItem key={s} value={s}>{isZh ? (SUB_DISTRICT_NAME_MAP[s] || s) : s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.street}</Label><Input value={form.street} onChange={e => setForm({...form, street: e.target.value})} className="h-11 bg-white border-none rounded-xl" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.city}</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="h-11 bg-white border-none rounded-xl" /></div>
                    <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.state}</Label><Input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="h-11 bg-white border-none rounded-xl" /></div>
                  </div>
                  <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">{addrT.postal_code}</Label><Input value={form.postalCode} onChange={e => setForm({...form, postalCode: e.target.value})} className="h-11 bg-white border-none rounded-xl" /></div>
                </div>
              )}
              <div className="flex items-center space-x-2 bg-white/50 p-4 rounded-2xl border border-dashed"><Checkbox id="default-addr" checked={form.isDefault} onCheckedChange={v => setForm({...form, isDefault: !!v})} /><Label htmlFor="default-addr" className="text-sm font-bold cursor-pointer">設為預設地址</Label></div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-muted/10 border-t flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsOpen(false)}>取消</Button>
            <Button className="flex-[2] rounded-xl font-black h-12 bg-primary shadow-lg" onClick={handleSave} disabled={isSubmitting || !form.lastName || !form.phone}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} 儲存地址</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
