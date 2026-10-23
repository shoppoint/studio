"use client";

import React from "react";
import { OverviewTab } from "./tabs/OverviewTab";
import { ItemsTab } from "./tabs/ItemsTab";
import { LogisticsTab } from "./tabs/LogisticsTab";
import { PaymentTab } from "./tabs/PaymentTab";
import { NotesTab } from "./tabs/NotesTab";

/**
 * @fileOverview 訂單管理分頁容器組件
 * 已完全模組化，確保在大型檔案語境下細節（如支付清單）不被簡化。
 * 每個子分頁組件位於 src/components/admin/orders/tabs/
 */

export function OrderOverviewTab(props: any) { return <OverviewTab {...props} />; }
export function OrderItemsTab(props: any) { return <ItemsTab {...props} />; }
export function OrderLogisticsTab(props: any) { return <LogisticsTab {...props} />; }
export function OrderPaymentTab(props: any) { return <PaymentTab {...props} />; }
export function OrderNotesTab(props: any) { return <NotesTab {...props} />; }
