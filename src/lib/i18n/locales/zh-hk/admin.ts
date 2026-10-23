
export const admin = {
  sidebar: {
    platform_control: "平台控制",
    system_overview: "系統概覽",
    order_mgmt: "訂單管理",
    vendor_mgmt: "合作商店管理",
    user_mgmt: "使用者管理",
    content_mgmt: "內容管理",
    article_mgmt: "最新消息管理",
    media_library: "多媒體庫",
    catalog_mgmt: "目錄管理",
    product_mgmt: "全域產品管理",
    category_mgmt: "分類設定",
    brand_mgmt: "品牌管理",
    warehouse_mgmt: "倉庫與庫存管理",
    marketing_crm: "行銷與顧客關係",
    marketing_loyalty: "行銷與忠誠度",
    notification_center: "通知中心",
    abandoned_carts: "遺棄購物車",
    email_broadcast: "電郵群發中心",
    ai_email: "AI 動態電郵",
    compliance: "合規性審查",
    product_mod: "產品審核",
    system_issues: "系統問題",
    configuration: "系統配置",
    global_analytics: "全域數據分析",
    platform_settings: "平台設定",
    back_to_store: "返回商店前台",
    stock_alerts: "缺貨通知請求",
    label_gen: "價錢牌生成器",
    data_infra: "基礎設施與數據健康"
  },
  media: {
    title: "多媒體庫",
    subtitle: "管理並整理雲端儲存空間的圖片。",
    upload_btn: "上傳媒體檔案",
    folders: "資料夾目錄",
    search_placeholder: "搜尋檔案名稱...",
    empty: "此資料夾內暫無檔案。",
    delete_confirm: "您確定要刪除此檔案嗎？此操作無法復原。",
    all_files: "所有檔案",
    table: {
      filename: "檔案名稱",
      size: "大小",
      path: "路徑",
      actions: "操作"
    }
  },
  dashboard: {
    title: "系統概覽",
    subtitle: "SHOP POINT 的全域健康狀況與效能指標。",
    total_gmv: "總成交額 (GMV)",
    total_users: "總使用者數",
    active_vendors: "活躍合作商店",
    pending_approvals: "待審核申請",
    revenue_growth: "全域營收增長",
    revenue_desc: "跨所有合作商店的每月總成交金額。",
    system_logs: "系統日誌",
    logs_desc: "最近的管理活動。",
    top_vendors: "表現最佳合作商店",
    vendors_desc: "本月對平台貢獻度最高的合作商店。",
    expiry_alert: "效期預警",
    near_expiry_count: "即將到期產品",
    view_expiry_report: "查看效期報表",
    ai_strategy_title: "AI 每週增長策略計劃",
    ai_strategy_subtitle: "結合訂單、流量與搜尋熱度，由 AI 提供的智能營運洞察。",
    ai_generate_btn: "生成本週增長計劃",
    ai_insight_demand: "市場需求洞察 (Demand)",
    ai_insight_inventory: "採購與庫存建議 (Inventory)",
    ai_insight_marketing: "促銷策略與活動 (Marketing)",
    ai_insight_social: "社交媒體計劃 (Social Media)",
    abandoned_carts: "被遺棄購物車",
    abandoned_value: "遺棄潛在金額",
    recovered_orders: "已挽回訂單",
    recovery_rate: "訂單挽回率",
    cart_analysis: "購物車流失與挽回分析",
    product_performance: {
      tab_title: "產品表現中心",
      title: "單品銷量深度分析",
      desc: "搜尋產品以獲取其在全歷史中的精確銷售數據，並支援多產品橫向對比。",
      search_placeholder: "搜尋產品名稱或 SKU...",
      compare_title: "產品表現對比",
      select_hint: "請選取至少一個產品進行分析。",
      weekly: "本週銷量",
      monthly: "本月銷量",
      yearly: "今年銷量",
      total: "總銷售量",
      revenue: "累計營收",
      empty_search: "找不到相符的產品。",
      add_to_compare: "加入對比",
      clear_all: "清空對比清單"
    },
    data_health: {
      tab_title: "內容質量審計",
      title: "Active 產品完整度診斷",
      desc: "自動掃描上架中產品，找出內容、SEO 或圖片缺失的項目，確保全站品質。",
      total_items: "審計產品總數",
      perfect_items: "完美資料項目",
      issue_items: "待補全項目",
      missing_content: "內容不全",
      missing_seo: "SEO 缺失",
      missing_media: "圖片缺失",
      missing_faq: "無 FAQ",
      missing_tags: "無搜尋標籤",
      fix_now: "立即補全"
    }
  },
  marketing: {
    title: "行銷與忠誠度",
    subtitle: "透過促銷活動、優惠碼及積分獎勵驅動銷售。",
    newsletter: "電郵訂閱名單",
    add_promo: "建立新優惠",
    add_reward: "新增換領項目",
    recurrence: {
      type_label: "自動週期重複",
      none: "不重複",
      weekly: "每週重複",
      monthly: "每月重複",
      day_of_week: "星期幾",
      day_of_month: "幾號",
      hint: "週期性促銷僅在日期區間內的指定日子生效。"
    }
  },
  articles: {
    title: "文章與消息管理",
    subtitle: "發布消息、食譜及小貼士，並監控傳播表現。",
    add_article: "新增文章",
    metrics: {
      views: "瀏覽數",
      likes: "點讚數",
      bookmarks: "收藏數",
      shares: "分享數"
    },
    table: {
      title: "標題",
      category: "分類",
      status: "狀態",
      date: "發布日期",
      actions: "操作",
      performance: "傳播表現"
    }
  },
  brands: {
    title: "品牌管理",
    subtitle: "管理所有平台品牌檔案。",
    add_brand: "新增品牌",
    table: {
      name: "品牌名稱"
    }
  },
  orders: {
    title: "訂單管理",
    subtitle: "追蹤、管理及執行平台銷售訂單。",
    table: {
      order_id: "訂單編號",
      date: "日期",
      customer: "顧客",
      total: "總計",
      payment: "付款狀態",
      fulfillment: "物流狀態",
      actions: "操作"
    },
    status: {
      pending: "待處理",
      processing: "處理中",
      reserved: "已留貨",
      ready_pickup: "待取貨",
      shipped: "已發貨",
      delivered: "已送達",
      picked_up: "已取貨",
      completed: "已完成",
      cancelled: "已取消"
    }
  },
  vendors: {
    title: "合作商店管理",
    subtitle: "核准、監控並管理所有合作商店。",
    edit_title: "編輯商店檔案",
    edit_subtitle: "更新合作夥伴身份與驗證資訊。",
    form: {
      status: "商店狀態",
      active: "啟用中",
      pending: "審核中",
      suspended: "已停權",
      store_name: "商店名稱",
      owner_name: "負責人姓名",
      phone: "聯絡電話",
      description: "商店簡介"
    },
    table: {
      info: "商店資訊",
      status: "狀態",
      actions: "操作"
    }
  },
  users: {
    title: "使用者管理",
    subtitle: "監控並管理所有平台參與者。",
    add_user: "新增使用者",
    search_placeholder: "搜尋使用者...",
    table: {
      user: "使用者",
      role: "角色",
      actions: "操作"
    }
  },
  warehouses: {
    title: "倉庫與庫存管理",
    subtitle: "管理產品儲存位置及網購出貨邏輯。",
    add_warehouse: "新增分店",
    form: {
      type: "地點類型",
      online: "網店集運中心",
      physical: "實體門市",
      location: "詳細地址資訊",
      weekly_title: "每週營業時間"
    },
    table: {
      name: "名稱",
      type: "類型",
      actions: "操作"
    }
  },
  products: {
    title: "全域產品管理",
    subtitle: "管理平台上所有產品。",
    add_product: "新增產品",
    table: {
      product: "產品名稱",
      price: "售價",
      stock: "庫存",
      status: "狀態",
      actions: "操作",
      created_at: "建立日期",
      last_updated: "更新日期"
    },
    urgency: {
      expired: "已過期",
      urgent: "極短期",
      safe: "安全期"
    }
  },
  categories: {
    title: "分類設定",
    subtitle: "管理全平台產品分類結構",
    add_category: "新增分類",
    table: {
      name: "分類名稱",
      visibility: "顯示狀態",
      actions: "操作"
    }
  },
  settings: {
    general: "基本設定",
    logistics: "運送安排",
    placeholder: "關鍵字、標題、SKU...",
    payment_methods: "付款方式",
    notifications: "通知範本",
    membership: "會員制度",
    marketing: "行銷配置",
    data_infra: "數據基礎",
    title: "平台設定",
    subtitle: "配置全站通用參數。",
    order_placed: "訂單已提交",
    order_shipped: "訂單已發貨",
    order_delivered: "訂單已送達",
    order_picked_up: "訂單已取貨",
    order_cancelled_paid: "訂單取消（已付款）",
    order_cancelled_unpaid: "訂單取消（未付款）",
    cash_coupon_notice: "現金券發放通知",
    promo_modal: "全站促銷彈窗",
    promo_modal_desc: "為所有訪客顯示首頁登陸彈窗。",
    promo_modal_image: "圖片網址 (URL)",
    promo_modal_link: "跳轉目標連結",
    google_analytics: "Google Analytics ID",
    facebook_pixel: "Facebook Pixel ID",
    membership_rules: "會員等級規則",
    spend_threshold: "消費門檻",
    threshold_period: "週期",
    pts_multiplier: "積分倍率",
    operating_hours: "營業時間設定",
    captcha: {
      title: "Google reCaptcha 安全防禦",
      desc: "設定機器人驗證機制，防止自動化腳本攻擊。",
      secret_key: "reCaptcha Secret Key",
      site_key_status: "Site Key 已於代碼中配置",
      contact_switch: "啟動聯絡表單驗證 (cap_contact)",
      auth_switch: "啟動登入/註冊驗證 (cap_auth)",
      checkout_switch: "啟動下單前驗證 (cap_checkout)"
    }
  }
};
