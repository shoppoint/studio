
export const admin = {
  sidebar: {
    platform_control: "Platform Control",
    system_overview: "System Overview",
    order_mgmt: "Order Management",
    vendor_mgmt: "Vendor Management",
    user_mgmt: "User Management",
    content_mgmt: "Content Management",
    article_mgmt: "News & Articles",
    media_library: "Media Library",
    catalog_mgmt: "Catalog Management",
    product_mgmt: "Product Inventory",
    category_mgmt: "Category Setup",
    brand_mgmt: "Brand Management",
    warehouse_mgmt: "Warehouse Management",
    marketing_crm: "Marketing & CRM",
    marketing_loyalty: "Marketing & Loyalty",
    notification_center: "Notification Center",
    abandoned_carts: "Abandoned Carts",
    email_broadcast: "Email Broadcast Center",
    ai_email: "AI Personalized Email",
    compliance: "Compliance",
    product_mod: "Product Moderation",
    system_issues: "System Issues",
    configuration: "Configuration",
    global_analytics: "Global Analytics",
    platform_settings: "Platform Settings",
    back_to_store: "Back to Storefront",
    stock_alerts: "Back in Stock Requests",
    label_gen: "Price Tag Generator",
    data_infra: "Infrastructure & Data Health"
  },
  media: {
    title: "Media Library",
    subtitle: "Manage and organize your cloud storage images.",
    upload_btn: "Upload Media",
    folders: "Folders",
    search_placeholder: "Search filename...",
    empty: "No files found in this folder.",
    delete_confirm: "Are you sure you want to delete this file? This cannot be undone.",
    all_files: "All Files",
    table: {
      filename: "File Name",
      size: "Size",
      path: "Path",
      actions: "Actions"
    }
  },
  dashboard: {
    title: "System Overview",
    subtitle: "Global health and performance metrics for SHOP POINT.",
    total_gmv: "Total GMV",
    total_users: "Total Users",
    active_vendors: "Active Vendors",
    pending_approvals: "Pending Approvals",
    revenue_growth: "Global Revenue Growth",
    revenue_desc: "Monthly Gross Merchandise Value across all vendors.",
    system_logs: "System Logs",
    logs_desc: "Recent administrative activities.",
    top_vendors: "Top Performing Vendors",
    vendors_desc: "Vendors with the highest platform contribution this month.",
    expiry_alert: "Expiry Alerts",
    near_expiry_count: "Items near expiry",
    view_expiry_report: "View Expiry Report",
    ai_strategy_title: "AI Weekly Growth Strategy",
    ai_strategy_subtitle: "Smart insights powered by orders, traffic and search trends.",
    ai_generate_btn: "Generate Growth Plan",
    ai_insight_demand: "Market Demand Insight",
    ai_insight_inventory: "Procurement & Stock Advice",
    ai_insight_marketing: "Promotion Strategy",
    ai_insight_social: "Social Media Plan",
    abandoned_carts: "Abandoned Carts",
    abandoned_value: "Abandoned Value",
    recovered_orders: "Recovered Orders",
    recovery_rate: "Recovery Rate",
    cart_analysis: "Abandoned Cart Analysis",
    product_performance: {
      tab_title: "Product Analytics",
      title: "SKU Performance Center",
      desc: "Analyze individual product sales across full history with side-by-side comparison.",
      search_placeholder: "Search name or SKU...",
      compare_title: "Performance Comparison",
      select_hint: "Select one or more products to start analysis.",
      weekly: "7D Sales",
      monthly: "30D Sales",
      yearly: "Yearly Sales",
      total: "Lifetime Sales",
      revenue: "Total Revenue",
      empty_search: "No matching products found.",
      add_to_compare: "Compare",
      clear_all: "Clear List"
    },
    data_health: {
      tab_title: "Data Quality",
      title: "Active Product Integrity Audit",
      desc: "Scan all 'Active' products for missing content, SEO, or images to maintain platform quality.",
      total_items: "Items Audited",
      perfect_items: "Complete Data",
      issue_items: "Items with Issues",
      missing_content: "Incomplete Story",
      missing_seo: "SEO Missing",
      missing_media: "Media Missing",
      missing_faq: "No FAQs",
      missing_tags: "No Tags",
      fix_now: "Fix Now"
    }
  },
  marketing: {
    title: "Marketing & Loyalty",
    subtitle: "Drive sales with promotions, coupons, and points.",
    newsletter: "Newsletter List",
    add_promo: "Add Promotion",
    add_reward: "Add Reward",
    recurrence: {
      type_label: "Automatic Recurrence",
      none: "None",
      weekly: "Weekly",
      monthly: "Monthly",
      day_of_week: "Day of Week",
      day_of_month: "Day of Month",
      hint: "Recurring promos only activate on the selected days."
    }
  },
  articles: {
    title: "News & Article Management",
    subtitle: "Manage your news and tips, and monitor content performance.",
    add_article: "Add Article",
    metrics: {
      views: "Views",
      likes: "Likes",
      bookmarks: "Saves",
      shares: "Shares"
    },
    table: {
      title: "Title",
      category: "Category",
      status: "Status",
      date: "Date",
      actions: "Actions",
      performance: "Performance"
    }
  },
  brands: {
    title: "Brand Management",
    subtitle: "Manage all platform brand profiles.",
    add_brand: "Add Brand",
    table: {
      name: "Brand Name"
    }
  },
  orders: {
    title: "Order Management",
    subtitle: "Track and manage sales orders.",
    table: {
      order_id: "Order ID",
      date: "Date",
      customer: "Customer",
      total: "Total",
      payment: "Payment",
      fulfillment: "Fulfillment",
      actions: "Actions"
    },
    status: {
      pending: "Pending",
      processing: "Processing",
      reserved: "Reserved",
      ready_pickup: "Ready for Pickup",
      shipped: "Shipped",
      delivered: "Delivered to Dest.",
      picked_up: "Picked up",
      completed: "Completed (Closed)",
      cancelled: "Cancelled"
    }
  },
  vendors: {
    title: "Vendor Management",
    subtitle: "Manage store profiles and partners.",
    edit_title: "Edit Store Profile",
    edit_subtitle: "Update partner identity and verification.",
    form: {
      status: "Status",
      active: "Active",
      pending: "Pending",
      suspended: "Suspended",
      store_name: "Store Name",
      owner_name: "Full Name",
      phone: "Phone",
      description: "Description"
    },
    table: {
      info: "Store Info",
      status: "Status",
      actions: "Actions"
    }
  },
  users: {
    title: "User Management",
    subtitle: "Manage all platform users.",
    add_user: "Add User",
    search_placeholder: "Search user...",
    table: {
      user: "User",
      role: "Role",
      actions: "Actions"
    }
  },
  warehouses: {
    title: "Warehouse Management",
    subtitle: "Manage locations and stock.",
    add_warehouse: "Add Location",
    form: {
      type: "Location Type",
      online: "Online Hub",
      physical: "Physical Store",
      location: "Address Info",
      weekly_title: "Weekly Operating Hours"
    },
    table: {
      name: "Name",
      type: "Type",
      actions: "Actions"
    }
  },
  products: {
    title: "Product Inventory",
    subtitle: "Manage global catalog.",
    add_product: "Add Product",
    table: {
      product: "Product",
      price: "Price",
      stock: "Stock",
      status: "Status",
      actions: "Actions",
      created_at: "Created",
      last_updated: "Updated"
    },
    urgency: {
      expired: "Expired",
      urgent: "Urgent",
      safe: "Safe"
    }
  },
  categories: {
    title: "Category Settings",
    subtitle: "Manage platform product category structure",
    add_category: "Add Category",
    table: {
      name: "Category Name",
      visibility: "Visibility",
      actions: "Actions"
    }
  },
  settings: {
    general: "General",
    logistics: "Logistics",
    payment_methods: "Payment Methods",
    notifications: "Notifications",
    membership: "Membership",
    marketing: "Marketing",
    data_infra: "Data Infra",
    title: "Platform Settings",
    subtitle: "Configure global parameters.",
    order_placed: "Order Placed",
    order_shipped: "Order Shipped",
    order_delivered: "Order Delivered",
    order_picked_up: "Order Picked Up",
    order_cancelled_paid: "Order Cancelled (Paid)",
    order_cancelled_unpaid: "Order Cancelled (Unpaid)",
    cash_coupon_notice: "Cash Coupon Issued",
    promo_modal: "Promotional Pop-up",
    promo_modal_desc: "Show a landing modal for all users.",
    promo_modal_image: "Image URL",
    promo_modal_link: "Target URL",
    google_analytics: "Google Analytics ID",
    facebook_pixel: "Facebook Pixel ID",
    membership_rules: "Membership Tier Rules",
    spend_threshold: "Spend Threshold",
    threshold_period: "Period",
    pts_multiplier: "Multiplier",
    operating_hours: "Operating Hours",
    captcha: {
      title: "Google reCaptcha Security",
      desc: "Configure bot detection to prevent automated script attacks.",
      secret_key: "reCaptcha Secret Key",
      site_key_status: "Site Key Configured in Code",
      contact_switch: "Enable Contact Form Protection",
      auth_switch: "Enable Login/Reg Protection",
      checkout_switch: "Enable Checkout Protection"
    }
  }
};
