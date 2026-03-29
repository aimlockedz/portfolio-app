import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface HoldingInput {
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  avgCost: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  dayChangePercent: number;
  weight: number; // % of portfolio
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { holdings, totalValue, totalCost, totalPnL, totalPnLPct, totalDayChange, totalDayChangePct } =
      (await request.json()) as {
        holdings: HoldingInput[];
        totalValue: number;
        totalCost: number;
        totalPnL: number;
        totalPnLPct: number;
        totalDayChange: number;
        totalDayChangePct: number;
      };

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ suggestion: "ไม่สามารถวิเคราะห์ได้ — ไม่พบ API key", type: "info" });
    }

    // Build portfolio context for AI
    const holdingsSummary = holdings
      .map(
        (h) =>
          `- ${h.symbol} (${h.name}, ${h.sector}): ${h.qty} shares, avg $${h.avgCost.toFixed(2)}, now $${h.currentPrice.toFixed(2)}, P&L ${h.pnlPercent >= 0 ? "+" : ""}${h.pnlPercent.toFixed(1)}%, weight ${h.weight.toFixed(1)}%, today ${h.dayChangePercent >= 0 ? "+" : ""}${h.dayChangePercent.toFixed(2)}%`
      )
      .join("\n");

    const sectorMap: Record<string, number> = {};
    holdings.forEach((h) => {
      sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.weight;
    });
    const sectorSummary = Object.entries(sectorMap)
      .sort((a, b) => b[1] - a[1])
      .map(([s, w]) => `${s}: ${w.toFixed(1)}%`)
      .join(", ");

    const prompt = `คุณเป็นที่ปรึกษาการลงทุนส่วนตัว วิเคราะห์พอร์ตหุ้นต่อไปนี้แล้วให้คำแนะนำสั้นๆ เป็นภาษาไทย

## ข้อมูลพอร์ต
- มูลค่ารวม: $${totalValue.toFixed(2)}
- ต้นทุน: $${totalCost.toFixed(2)}
- กำไร/ขาดทุนรวม: ${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)} (${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(1)}%)
- เปลี่ยนแปลงวันนี้: ${totalDayChange >= 0 ? "+" : ""}$${totalDayChange.toFixed(2)} (${totalDayChangePct >= 0 ? "+" : ""}${totalDayChangePct.toFixed(2)}%)

## การกระจายตัว Sector
${sectorSummary}

## หุ้นในพอร์ต
${holdingsSummary}

## ให้ตอบ JSON เท่านั้น (ห้ามมี markdown, ห้ามมี code block):
{
  "suggestion": "คำแนะนำ 2-3 ประโยคเป็นภาษาไทย กระชับ ใช้ได้จริง",
  "type": "success | warning | info | danger",
  "actions": ["action 1 สั้นๆ", "action 2 สั้นๆ"]
}

กฎ:
- suggestion: วิเคราะห์จุดแข็ง จุดอ่อนของพอร์ต + คำแนะนำเชิงปฏิบัติ
- type: success=พอร์ตดี, warning=มีจุดต้องระวัง, info=ปกติ, danger=ต้องแก้ไขด่วน
- actions: 1-3 action items สั้นๆ ที่ทำได้จริง (เช่น "ลดสัดส่วน MU ลง", "เพิ่มหุ้น defensive")`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "คุณเป็นที่ปรึกษาการลงทุนที่เชี่ยวชาญ ตอบเป็น JSON เท่านั้น" },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ suggestion: "ไม่สามารถวิเคราะห์ได้ในขณะนี้", type: "info", actions: [] });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        suggestion: parsed.suggestion || "ไม่มีข้อมูลเพียงพอ",
        type: parsed.type || "info",
        actions: parsed.actions || [],
      });
    } catch {
      // If JSON parse fails, use raw text
      return NextResponse.json({
        suggestion: content.slice(0, 300),
        type: "info",
        actions: [],
      });
    }
  } catch (err) {
    return NextResponse.json(
      { suggestion: "เกิดข้อผิดพลาด", type: "info", actions: [] },
      { status: 500 }
    );
  }
}
