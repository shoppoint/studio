"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface VendorRevenueChartProps {
  data: any[];
}

export default function VendorRevenueChart({ data }: VendorRevenueChartProps) {
  return (
    <ChartContainer 
      config={{
        gross: { label: "Gross", color: "hsl(var(--primary))" },
        net: { label: "Net (90%)", color: "#10b981" }
      }}
      className="h-full w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(v: any) => `$${v}`} 
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Line 
            type="monotone" 
            dataKey="gross" 
            stroke="var(--color-gross)" 
            strokeWidth={3} 
            dot={{ r: 4 }} 
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="net" 
            stroke="var(--color-net)" 
            strokeWidth={3} 
            dot={{ r: 4 }} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
