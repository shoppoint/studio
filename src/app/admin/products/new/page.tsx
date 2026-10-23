"use client";

import { ProductFormContainer } from "@/components/admin/products/ProductFormContainer";

const INITIAL_SKELETON = {
  productName_en: "", productName_zh: "", slug: "", description_en: "", description_zh: "", 
  longDescription_en: "", longDescription_zh: "", ingredients_en: "", ingredients_zh: "", 
  searchKeywordsRaw: "", searchKeywordsRaw_en: "", categories: [], primaryBrand: "", 
  collabBrands: [], condition: "New", inventoryPolicy: "Deny", vendorId: "", 
  googleProductCategory: "", sku: "", barcode: "", price: "0", salePrice: "0", 
  stock: 0, onlineStock: 0, warehouseStock: {}, status: "Active", showInPos: true, 
  limitToPickup: false, inStoreOnly: false, isFeatured: "No", imageUrl: "", images: [], 
  youtubeUrl: "",
  relatedProducts: [], 
  accessoryProductIds: [], badgeText_en: "", badgeText_zh: "", badgeBgColor: "#FFD700", 
  badgeTextColor: "#000000", length: "", width: "", height: "", dimensionUnit: "cm", 
  batches: [], 
  spec: { 
    origin: "Hong Kong", qty: "", qtyUnit: "pcs", netWeight: "", netWeightUnit: "g",
    mfrName_zh: "", mfrName_en: "", mfrAddress_zh: "", mfrAddress_en: "",
    storageInstructions_zh: "", storageInstructions_en: "",
    usageInstructions_zh: "", usageInstructions_en: "",
    activeIngredients_zh: "", activeIngredients_en: "",
    useScope_zh: "", useScope_en: "",
    caution_zh: "", caution_en: "",
    legalTags: []
  }, 
  seoTitle_en: "", seoTitle_zh: "", seoDescription_en: "", seoDescription_zh: "", 
  seoKeywords_en: "", seoKeywords_zh: "", isGmcPhotoRequired: false, shelfPhotoUrl: "", 
  isClearance: false, faqs_en: [], faqs_zh: [],
  preOrderExpectedDate: "", 
  preOrderDeadline: "", 
  preOrderDisplayStart: ""
};

export default function AdminNewProductPage() {
  return (
    <ProductFormContainer 
      mode="new" 
      initialData={INITIAL_SKELETON} 
      isVendor={false} 
    />
  );
}
