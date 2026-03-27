import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function summarizeInThai(articles: { headline: string; summary: string }[]): Promise<string[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || articles.length === 0) return articles.map((a) => a.summary);

  const prompt = `คุณเป็นนักวิเคราะห์การเงิน สรุปข่าวต่อไปนี้เป็นภาษาไทย แต่ละข่าวสรุป 2-3 ประโยค กระชับ เข้าใจง่าย เน้นผลกระทบต่อตลาดหุ้น/นักลงทุน

ตอบในรูปแบบ JSON array ของ string เท่านั้น ไม่ต้องมี markdown
ตัวอย่าง: ["สรุปข่าว 1", "สรุปข่าว 2"]

ข่าว:
${articles.map((a, i) => `${i + 1}. ${a.headline}\n${a.summary}`).join("\n\n")}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
      }
    );

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length === articles.length) {
        return parsed;
      }
    }
  } catch {
    // Fall through to original summaries
  }

  return articles.map((a) => a.summary);
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

    const raw = data.slice(0, 20).map((a: any) => ({
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

    const articles = raw.map((a, i) => ({
      ...a,
      summaryTh: thaiSummaries[i] || a.summary,
    }));

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [], error: "Failed to fetch news" }, { status: 500 });
  }
}
