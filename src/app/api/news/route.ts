import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function summarizeInThai(articles: { headline: string; summary: string }[]): Promise<string[]> {
  // Try Groq first, then Gemini as fallback
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (articles.length === 0) return [];

  const systemPrompt = "คุณเป็นนักวิเคราะห์การเงิน สรุปข่าวเป็นภาษาไทย กระชับ เข้าใจง่าย เน้นผลกระทบต่อตลาดหุ้น/นักลงทุน";

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

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || "general";
  const minId = request.nextUrl.searchParams.get("minId") || "";

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 503 });
  }

  try {
    const url = new URL("https://finnhub.io/api/v1/news");
    url.searchParams.set("category", category);
    url.searchParams.set("token", apiKey);
    if (minId) url.searchParams.set("minId", minId);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    const data = await res.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ articles: [], error: "Unexpected response" });
    }

    const raw = data.slice(0, 15).map((a: any) => ({
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

    // AI summarize in Thai (batch)
    const thaiSummaries = await summarizeInThai(
      raw.map((a) => ({ headline: a.headline, summary: a.summary }))
    );

    const hasAI = thaiSummaries.length > 0 && thaiSummaries.some((s) => s.length > 0);

    const articles = raw.map((a, i) => ({
      ...a,
      summaryTh: thaiSummaries[i] || "",
    }));

    return NextResponse.json({ articles, aiEnabled: hasAI });
  } catch {
    return NextResponse.json({ articles: [], error: "Failed to fetch news" }, { status: 500 });
  }
}
