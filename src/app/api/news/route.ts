import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function summarizeInThai(articles: { headline: string; summary: string }[]): Promise<string[]> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (articles.length === 0) return [];

  const systemPrompt = `คุณเป็นนักวิเคราะห์การเงิน สรุปข่าวเป็นภาษาไทย กระชับ เข้าใจง่าย เน้นผลกระทบต่อตลาดหุ้น/นักลงทุน
หากข่าวมีการกล่าวถึงหุ้นรายตัว หรือมีนักวิเคราะห์/สถาบันให้ความเห็น ให้เพิ่มคำแนะนำ [SUGGESTION:Strong Buy], [SUGGESTION:Buy], [SUGGESTION:Hold], [SUGGESTION:Sell], หรือ [SUGGESTION:Strong Sell] ไว้ท้ายสรุป
ถ้าข่าวไม่ได้ระบุชัดเจน ไม่ต้องใส่ suggestion`;

  const userPrompt = `สรุปข่าว ${articles.length} ข่าวต่อไปนี้เป็นภาษาไทย แต่ละข่าวสรุป 2-3 ประโยค
ตอบเป็น JSON array ของ string เท่านั้น ห้ามมี markdown หรือ code block
จำนวนสมาชิกใน array ต้องเท่ากับ ${articles.length}

${articles.map((a, i) => `${i + 1}. ${a.headline}\n${a.summary}`).join("\n\n")}`;

  // Try Groq (Llama 3.3 70B - free, fast)
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content || "";
        const parsed = parseJsonArray(text, articles.length);
        if (parsed) return parsed;
      }
    } catch { /* fall through */ }
  }

  // Fallback: Gemini
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = parseJsonArray(text, articles.length);
        if (parsed) return parsed;
      }
    } catch { /* fall through */ }
  }

  return [];
}

function parseJsonArray(text: string, expectedLength: number): string[] | null {
  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) {
        const result: string[] = [];
        for (let i = 0; i < expectedLength; i++) {
          result.push(typeof parsed[i] === "string" ? parsed[i] : "");
        }
        return result;
      }
    }
  } catch { /* invalid json */ }
  return null;
}

// Extract suggestion from Thai summary
function extractSuggestion(text: string): { summary: string; suggestion: string | null } {
  const match = text.match(/\[SUGGESTION:(Strong Buy|Buy|Hold|Sell|Strong Sell)\]/i);
  if (match) {
    return {
      summary: text.replace(match[0], "").trim(),
      suggestion: match[1],
    };
  }
  return { summary: text, suggestion: null };
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || "general";
  const symbol = request.nextUrl.searchParams.get("symbol") || "";
  const minId = request.nextUrl.searchParams.get("minId") || "";

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 503 });
  }

  try {
    let raw: any[] = [];

    if (symbol) {
      // Stock-specific news from Finnhub
      const now = Math.floor(Date.now() / 1000);
      const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const to = new Date().toISOString().split("T")[0];
      const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      const data = await res.json();

      if (Array.isArray(data)) {
        raw = data.slice(0, 15).map((a: any) => ({
          id: a.id,
          headline: a.headline,
          source: a.source,
          url: a.url,
          image: a.image || null,
          summary: a.summary,
          category: "stock",
          datetime: a.datetime,
          related: a.related || symbol,
        }));
      }
    } else {
      // General market news
      const url = new URL("https://finnhub.io/api/v1/news");
      if (category !== "all") {
        url.searchParams.set("category", category);
      } else {
        url.searchParams.set("category", "general");
      }
      url.searchParams.set("token", apiKey);
      if (minId) url.searchParams.set("minId", minId);

      const res = await fetch(url.toString(), { next: { revalidate: 300 } });
      const data = await res.json();

      if (!Array.isArray(data)) {
        return NextResponse.json({ articles: [], error: "Unexpected response" });
      }

      raw = data.slice(0, 15).map((a: any) => ({
        id: a.id,
        headline: a.headline,
        source: a.source,
        url: a.url,
        image: a.image || null,
        summary: a.summary,
        category: a.category,
        datetime: a.datetime,
        related: a.related || "",
      }));

      // For "all" category, also fetch other categories and merge
      if (category === "all") {
        const otherCats = ["forex", "crypto", "merger"];
        const otherResults = await Promise.all(
          otherCats.map(async (cat) => {
            try {
              const catUrl = `https://finnhub.io/api/v1/news?category=${cat}&token=${apiKey}`;
              const catRes = await fetch(catUrl, { next: { revalidate: 300 } });
              const catData = await catRes.json();
              if (Array.isArray(catData)) {
                return catData.slice(0, 5).map((a: any) => ({
                  id: a.id,
                  headline: a.headline,
                  source: a.source,
                  url: a.url,
                  image: a.image || null,
                  summary: a.summary,
                  category: a.category,
                  datetime: a.datetime,
                  related: a.related || "",
                }));
              }
            } catch { /* skip */ }
            return [];
          })
        );
        const additional = otherResults.flat();
        // Merge and dedupe by id, sort by datetime desc
        const seen = new Set(raw.map((a) => a.id));
        additional.forEach((a) => {
          if (!seen.has(a.id)) {
            raw.push(a);
            seen.add(a.id);
          }
        });
        raw.sort((a, b) => b.datetime - a.datetime);
        raw = raw.slice(0, 20);
      }
    }

    // AI summarize in Thai (batch)
    const thaiSummaries = await summarizeInThai(
      raw.map((a) => ({ headline: a.headline, summary: a.summary }))
    );

    const hasAI = thaiSummaries.length > 0 && thaiSummaries.some((s) => s.length > 0);

    const articles = raw.map((a, i) => {
      const rawThai = thaiSummaries[i] || "";
      const { summary: cleanThai, suggestion } = extractSuggestion(rawThai);
      return {
        ...a,
        summaryTh: cleanThai,
        suggestion,
      };
    });

    return NextResponse.json({ articles, aiEnabled: hasAI });
  } catch {
    return NextResponse.json({ articles: [], error: "Failed to fetch news" }, { status: 500 });
  }
}
