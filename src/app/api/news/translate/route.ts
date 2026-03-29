import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

/**
 * POST /api/news/translate
 * Fetches an article URL, extracts text content, and translates to Thai using Gemini.
 * Body: { url: string, headline: string, summary: string }
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: "Translation not available" }, { status: 503 });
  }

  const body = await request.json();
  const { url, headline, summary } = body as {
    url?: string;
    headline?: string;
    summary?: string;
  };

  if (!url || !headline) {
    return NextResponse.json({ error: "URL and headline required" }, { status: 400 });
  }

  try {
    // Fetch the article page
    let articleText = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; StockPortfolio/1.0)",
          Accept: "text/html",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        articleText = extractArticleText(html);
      }
    } catch {
      // If fetch fails, we'll translate headline + summary instead
    }

    // Build the content to translate
    const contentToTranslate = articleText.length > 200
      ? articleText.slice(0, 5000) // cap to avoid token explosion
      : `${headline}\n\n${summary || ""}`;

    const prompt = `คุณเป็นนักแปลข่าวการเงินมืออาชีพ แปลเนื้อหาข่าวต่อไปนี้เป็นภาษาไทย อย่างละเอียดและครบถ้วน

กฎ:
- แปลเนื้อหาข่าวทั้งหมดเป็นภาษาไทยที่อ่านง่าย เป็นธรรมชาติ
- ศัพท์เทคนิค/ชื่อเฉพาะทางการเงินให้คงภาษาอังกฤษไว้ในวงเล็บ เช่น อัตราส่วนราคาต่อกำไร (P/E Ratio)
- ชื่อบริษัท หุ้น ชื่อบุคคลให้คงภาษาอังกฤษ
- จัดย่อหน้าให้อ่านง่าย
- ถ้าข่าวมีตัวเลขสำคัญ (ราคาหุ้น, %, มูลค่า) ต้องแปลให้ครบ
- ห้ามเพิ่มความคิดเห็นของตนเอง แปลตรงตามต้นฉบับ

หัวข้อข่าว: ${headline}

เนื้อหา:
${contentToTranslate}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      return NextResponse.json({ error: "Translation failed" }, { status: 502 });
    }

    const geminiJson = await geminiRes.json();
    const translated = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!translated) {
      return NextResponse.json({ error: "No translation returned" }, { status: 502 });
    }

    return NextResponse.json({
      translatedContent: translated,
      sourceLength: contentToTranslate.length,
      hasFullArticle: articleText.length > 200,
    });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}

/**
 * Extract readable text from HTML, focusing on article content.
 */
function extractArticleText(html: string): string {
  // Remove script, style, nav, header, footer tags and their content
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "");

  // Try to extract from <article> tag first
  const articleMatch = text.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    text = articleMatch[1];
  }

  // Convert <p>, <br>, <h*> to newlines, strip remaining tags
  text = text
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  // Take only substantial text (skip if too short = likely a paywall)
  const lines = text.split("\n").filter((l) => l.trim().length > 30);
  return lines.join("\n").trim();
}
