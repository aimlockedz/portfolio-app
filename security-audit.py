from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas
from datetime import datetime

OUTPUT = "Security_Privacy_Audit_Report.pdf"

# Colors
PRIMARY = HexColor("#10b981")
DARK = HexColor("#1a1a2e")
RED = HexColor("#ef4444")
AMBER = HexColor("#f59e0b")
GREEN = HexColor("#10b981")
BLUE = HexColor("#3b82f6")
GRAY = HexColor("#6b7280")
LIGHT_BG = HexColor("#f8fafc")
WHITE = HexColor("#ffffff")
RED_BG = HexColor("#fef2f2")
AMBER_BG = HexColor("#fffbeb")
GREEN_BG = HexColor("#f0fdf4")
BLUE_BG = HexColor("#eff6ff")

styles = getSampleStyleSheet()

# Custom styles
styles.add(ParagraphStyle(
    "CoverTitle", parent=styles["Title"],
    fontSize=28, leading=34, textColor=DARK,
    spaceAfter=6, alignment=TA_CENTER, fontName="Helvetica-Bold"
))
styles.add(ParagraphStyle(
    "CoverSub", parent=styles["Normal"],
    fontSize=14, leading=18, textColor=GRAY,
    alignment=TA_CENTER, spaceAfter=4
))
styles.add(ParagraphStyle(
    "SectionTitle", parent=styles["Heading1"],
    fontSize=16, leading=20, textColor=DARK,
    spaceBefore=20, spaceAfter=10, fontName="Helvetica-Bold"
))
styles.add(ParagraphStyle(
    "SubSection", parent=styles["Heading2"],
    fontSize=12, leading=16, textColor=HexColor("#374151"),
    spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold"
))
styles.add(ParagraphStyle(
    "BodyText2", parent=styles["Normal"],
    fontSize=9.5, leading=14, textColor=HexColor("#374151"),
    spaceAfter=6
))
styles.add(ParagraphStyle(
    "FindingText", parent=styles["Normal"],
    fontSize=9, leading=13, textColor=HexColor("#4b5563"),
    leftIndent=12, spaceAfter=4
))
styles.add(ParagraphStyle(
    "CodeStyle", parent=styles["Normal"],
    fontSize=8, leading=11, fontName="Courier",
    textColor=HexColor("#1f2937"), leftIndent=16, spaceAfter=6,
    backColor=HexColor("#f3f4f6")
))
styles.add(ParagraphStyle(
    "Footer", parent=styles["Normal"],
    fontSize=7, textColor=GRAY, alignment=TA_CENTER
))

def severity_badge(level):
    colors = {
        "CRITICAL": (RED, WHITE),
        "HIGH": (HexColor("#dc2626"), WHITE),
        "MEDIUM": (AMBER, HexColor("#1a1a2e")),
        "LOW": (GREEN, WHITE),
        "PASS": (BLUE, WHITE),
    }
    bg, fg = colors.get(level, (GRAY, WHITE))
    return f'<font backColor="{bg}" color="{fg}"><b>&nbsp;{level}&nbsp;</b></font>'

def make_finding_block(finding_id, title, severity, description, files, recommendation):
    elements = []
    sev_text = severity_badge(severity)

    header_data = [[
        Paragraph(f"<b>{finding_id}</b>", styles["BodyText2"]),
        Paragraph(f"<b>{title}</b>", styles["BodyText2"]),
        Paragraph(sev_text, styles["BodyText2"]),
    ]]
    header_table = Table(header_data, colWidths=[50, 340, 80])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#e5e7eb")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)

    elements.append(Paragraph(description, styles["FindingText"]))

    if files:
        file_text = "<b>Affected Files:</b> " + ", ".join([f"<font face='Courier' size='8'>{f}</font>" for f in files])
        elements.append(Paragraph(file_text, styles["FindingText"]))

    rec_text = f"<b>Recommendation:</b> {recommendation}"
    elements.append(Paragraph(rec_text, styles["FindingText"]))
    elements.append(Spacer(1, 8))

    return KeepTogether(elements)


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=A4,
        topMargin=2*cm, bottomMargin=2*cm,
        leftMargin=2*cm, rightMargin=2*cm
    )
    story = []

    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 60))
    story.append(Paragraph("SECURITY &amp; PRIVACY", styles["CoverTitle"]))
    story.append(Paragraph("AUDIT REPORT", styles["CoverTitle"]))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="60%", thickness=2, color=PRIMARY, spaceAfter=12))
    story.append(Paragraph("StockPortfolio Web Application", styles["CoverSub"]))
    story.append(Paragraph("Next.js 15 + Turso + Vercel", styles["CoverSub"]))
    story.append(Spacer(1, 30))

    cover_data = [
        ["Document Type", "Security &amp; Privacy Audit Report"],
        ["Application", "StockPortfolio (portfolio-app)"],
        ["Version", "1.0.0"],
        ["Date", datetime.now().strftime("%B %d, %Y")],
        ["Auditor", "Claude AI - QA Security Tester"],
        ["Framework", "Next.js 15 (App Router)"],
        ["Database", "Turso (libsql) - Tokyo Region"],
        ["Hosting", "Vercel (Free Tier)"],
        ["Classification", "CONFIDENTIAL"],
    ]
    cover_table = Table(cover_data, colWidths=[150, 310])
    cover_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), HexColor("#f1f5f9")),
        ("TEXTCOLOR", (0, 0), (0, -1), HexColor("#475569")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(cover_table)
    story.append(PageBreak())

    # ==================== EXECUTIVE SUMMARY ====================
    story.append(Paragraph("1. Executive Summary", styles["SectionTitle"]))
    story.append(Paragraph(
        "This report presents the findings of a comprehensive security and privacy audit "
        "conducted on the StockPortfolio web application. The audit covered authentication, "
        "authorization, input validation, XSS, SQL injection, secret management, security headers, "
        "rate limiting, error handling, and dependency analysis.",
        styles["BodyText2"]
    ))
    story.append(Spacer(1, 8))

    # Summary stats
    summary_data = [
        [Paragraph("<b>Category</b>", styles["BodyText2"]),
         Paragraph("<b>Findings</b>", styles["BodyText2"]),
         Paragraph("<b>Risk</b>", styles["BodyText2"])],
        ["Total Findings", "12", ""],
        ["Critical", "1", severity_badge("CRITICAL")],
        ["High", "2", severity_badge("HIGH")],
        ["Medium", "4", severity_badge("MEDIUM")],
        ["Low", "3", severity_badge("LOW")],
        ["Pass (No Issues)", "2", severity_badge("PASS")],
    ]
    # Convert strings to Paragraphs
    for i in range(1, len(summary_data)):
        for j in range(len(summary_data[i])):
            if isinstance(summary_data[i][j], str):
                summary_data[i][j] = Paragraph(summary_data[i][j], styles["BodyText2"])

    sum_table = Table(summary_data, colWidths=[200, 100, 160])
    sum_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(sum_table)
    story.append(Spacer(1, 10))

    # Overall Score
    story.append(Paragraph("<b>Overall Security Score: 6.5 / 10</b>", styles["SubSection"]))
    story.append(Paragraph(
        "The application has a solid foundation with proper auth framework (Lucia), "
        "parameterized queries (Drizzle ORM), and React's built-in XSS protection. "
        "However, critical gaps in rate limiting, security headers, and input validation "
        "need immediate attention before production use.",
        styles["BodyText2"]
    ))
    story.append(PageBreak())

    # ==================== FINDINGS ====================
    story.append(Paragraph("2. Detailed Findings", styles["SectionTitle"]))

    # --- AUTH & SESSION ---
    story.append(Paragraph("2.1 Authentication &amp; Session Management", styles["SubSection"]))

    story.append(make_finding_block(
        "SEC-001", "No Rate Limiting on Authentication Endpoints", "HIGH",
        "Login and registration endpoints have no rate limiting protection. "
        "An attacker can perform unlimited brute-force attempts against /api/auth/login "
        "or create unlimited accounts via /api/auth/register without any throttling.",
        ["src/app/api/auth/login/route.ts", "src/app/api/auth/register/route.ts"],
        "Implement rate limiting using Vercel's Edge middleware or upstash/ratelimit. "
        "Limit login to 5 attempts per IP per 15 minutes. Limit registration to 3 per hour per IP. "
        "Consider adding CAPTCHA after 3 failed login attempts."
    ))

    story.append(make_finding_block(
        "SEC-002", "Session Cookie Configuration - PASS", "PASS",
        "Session cookies are properly configured with httpOnly: true, sameSite: 'lax', "
        "secure: true (in production), and maxAge: 30 days. Sliding window session renewal "
        "is implemented in middleware. Lucia auth handles session validation correctly.",
        ["src/middleware.ts (lines 24-29)"],
        "No action needed. Configuration follows security best practices."
    ))

    story.append(make_finding_block(
        "SEC-003", "Password Hashing - PASS", "PASS",
        "Passwords are hashed using bcryptjs with cost factor 10 (bcrypt.hash(password, 10)). "
        "Login uses bcrypt.compare() for timing-safe comparison. Error messages are generic "
        "('Incorrect email or password') preventing user enumeration.",
        ["src/app/api/auth/login/route.ts", "src/app/api/auth/register/route.ts"],
        "No action needed. Consider upgrading to Argon2id for new deployments."
    ))

    # --- AUTHORIZATION ---
    story.append(Paragraph("2.2 Authorization", styles["SubSection"]))

    story.append(make_finding_block(
        "SEC-004", "Unprotected AI/Analysis API Endpoints", "MEDIUM",
        "Several API endpoints that consume expensive external resources (Groq LLM, Finnhub API) "
        "are accessible without authentication: /api/watchlist/ai-take (Groq AI analysis), "
        "/api/stock/recommendation (Finnhub), /api/portfolio/correlation. "
        "An attacker could exhaust API quotas without logging in.",
        ["src/app/api/watchlist/ai-take/route.ts", "src/app/api/stock/recommendation/route.ts",
         "src/app/api/portfolio/correlation/route.ts"],
        "Add authentication checks to AI and analysis endpoints that consume paid API resources. "
        "Public data endpoints (quotes, market overview) can remain unauthenticated."
    ))

    story.append(make_finding_block(
        "SEC-005", "All User-Data Routes Properly Protected", "LOW",
        "All portfolio, transaction, journal, alert, and watchlist endpoints verify user "
        "authentication via getUser() before processing. Ownership checks ensure users can "
        "only access their own data (e.g., holdings filtered by userId).",
        ["src/app/api/portfolio/holdings/route.ts", "src/app/api/portfolio/transactions/route.ts"],
        "Continue this pattern for all new endpoints. Consider adding RBAC if multi-user features expand."
    ))

    story.append(PageBreak())

    # --- INPUT VALIDATION ---
    story.append(Paragraph("2.3 Input Validation", styles["SubSection"]))

    story.append(make_finding_block(
        "SEC-006", "Insufficient Input Validation Across API Routes", "MEDIUM",
        "Multiple API endpoints accept user input without proper validation: "
        "- Symbol fields: only check if (!symbol), no format/length validation. "
        "- Text fields (notes, thesis, bio): no length limits, allowing potential abuse. "
        "- Numeric fields: no range validation (convictionLevel should be 1-5, targetPercent 0-100). "
        "- No regex validation for stock symbols (should be 1-5 uppercase alpha characters).",
        ["src/app/api/watchlist/route.ts", "src/app/api/journal/route.ts",
         "src/app/api/profile/route.ts", "src/app/api/portfolio/allocation-targets/route.ts"],
        "Add Zod schema validation for all API inputs. Validate: "
        "symbol: /^[A-Z]{1,5}$/, text fields: max 1000 chars, "
        "convictionLevel: 1-5, targetPercent: 0-100, price: > 0 and < 10000000."
    ))

    # --- SQL INJECTION ---
    story.append(Paragraph("2.4 SQL Injection", styles["SubSection"]))

    story.append(make_finding_block(
        "SEC-007", "SQL Injection - Well Protected via Drizzle ORM", "LOW",
        "All database operations use Drizzle ORM with parameterized queries. "
        "No raw SQL concatenation with user input was found. One instance of raw SQL "
        "exists for schema management (CREATE TABLE IF NOT EXISTS) in alerts route, "
        "but it uses no user-controlled values.",
        ["src/app/api/portfolio/alerts/route.ts (lines 30-39)"],
        "Replace raw CREATE TABLE calls with proper Drizzle migrations. "
        "The current approach works but bypasses type safety with (db as any).run()."
    ))

    # --- XSS ---
    story.append(Paragraph("2.5 Cross-Site Scripting (XSS)", styles["SubSection"]))

    story.append(make_finding_block(
        "SEC-008", "XSS - Well Protected via React Default Escaping", "LOW",
        "No dangerouslySetInnerHTML usage found anywhere in the codebase. "
        "All user input is rendered through React's default JSX escaping. "
        "Minor risk: AI-generated content from Groq API is rendered as text, which is "
        "safe in React but could be a concern if rendering format changes.",
        ["src/components/shared/watchlist-client.tsx"],
        "Continue using React's default escaping. If rich HTML rendering is needed in the future, "
        "use DOMPurify to sanitize AI-generated content before rendering."
    ))

    story.append(PageBreak())

    # --- SECURITY HEADERS ---
    story.append(Paragraph("2.6 Security Headers &amp; CORS", styles["SubSection"]))

    story.append(make_finding_block(
        "SEC-009", "No Security Headers Configured", "HIGH",
        "next.config.ts has no security headers configured. Missing headers: "
        "Content-Security-Policy (CSP), X-Content-Type-Options, X-Frame-Options, "
        "X-XSS-Protection, Strict-Transport-Security (HSTS), Referrer-Policy. "
        "This leaves the app vulnerable to clickjacking, MIME sniffing, and other attacks.",
        ["next.config.ts"],
        "Add security headers to next.config.ts:\n"
        "headers: () => [{ source: '/(.*)', headers: [\n"
        "  { key: 'X-Frame-Options', value: 'DENY' },\n"
        "  { key: 'X-Content-Type-Options', value: 'nosniff' },\n"
        "  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },\n"
        "  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },\n"
        "]}]"
    ))

    # --- ERROR HANDLING ---
    story.append(Paragraph("2.7 Error Handling &amp; Information Disclosure", styles["SubSection"]))

    story.append(make_finding_block(
        "SEC-010", "Debug Data Leaked in API Error Responses", "MEDIUM",
        "Three API endpoints return raw error strings to the client via 'debug: String(err)' field. "
        "This can leak internal file paths, database connection details, stack traces, and "
        "third-party API error messages to attackers.",
        ["src/app/api/portfolio/correlation/route.ts (line 95)",
         "src/app/api/portfolio/history/route.ts (line 282)",
         "src/app/api/stock/financials/route.ts (line 126)"],
        "Remove 'debug' field from all production error responses. "
        "Log errors server-side with console.error() and return only generic messages to clients."
    ))

    # --- RATE LIMITING ---
    story.append(Paragraph("2.8 Rate Limiting &amp; DoS Protection", styles["SubSection"]))

    story.append(make_finding_block(
        "SEC-011", "No Rate Limiting on Any Endpoint", "CRITICAL",
        "No rate limiting exists on any API endpoint. This is the most critical finding. "
        "Attackers can: (1) brute-force login credentials, (2) exhaust Groq/Finnhub API quotas "
        "(costing money and causing service disruption), (3) spam registration creating fake accounts, "
        "(4) DoS the application by flooding computationally expensive endpoints like AI analysis.",
        ["All API routes under src/app/api/"],
        "Implement rate limiting immediately using @upstash/ratelimit with Vercel KV or "
        "use Vercel's built-in Edge Rate Limiting. Priority tiers:\n"
        "- Auth endpoints: 5 requests/15min per IP\n"
        "- AI endpoints: 10 requests/hour per user\n"
        "- Public data endpoints: 60 requests/min per IP\n"
        "- Write operations: 30 requests/min per user"
    ))

    story.append(PageBreak())

    # --- SECRETS ---
    story.append(Paragraph("2.9 Secret Management", styles["SubSection"]))

    story.append(make_finding_block(
        "SEC-012", "Environment Variables Properly Configured", "MEDIUM",
        ".env.local is correctly listed in .gitignore and is NOT committed to the repository. "
        "All API keys (FINNHUB_API_KEY, GROQ_API_KEY, TURSO_AUTH_TOKEN) are accessed "
        "server-side only via process.env, never exposed to the client. "
        "No NEXT_PUBLIC_ prefixed variables contain sensitive data. "
        "However, ESLint is disabled during builds (ignoreDuringBuilds: true), "
        "which could allow security-related lint warnings to go unnoticed.",
        ["next.config.ts", ".gitignore"],
        "Enable ESLint during builds to catch potential issues. "
        "Rotate API keys periodically. Use Vercel Environment Variables for production secrets."
    ))

    # ==================== PRIVACY ASSESSMENT ====================
    story.append(PageBreak())
    story.append(Paragraph("3. Privacy Assessment", styles["SectionTitle"]))

    privacy_data = [
        [Paragraph("<b>Data Type</b>", styles["BodyText2"]),
         Paragraph("<b>Stored</b>", styles["BodyText2"]),
         Paragraph("<b>Encrypted</b>", styles["BodyText2"]),
         Paragraph("<b>Notes</b>", styles["BodyText2"])],
    ]
    privacy_items = [
        ["Email Address", "Yes", "No (plaintext)", "Used for login, unique constraint"],
        ["Password", "Yes", "bcrypt hash (cost 10)", "Properly hashed, never stored in plaintext"],
        ["Display Name", "Yes", "No (plaintext)", "User-provided, no validation"],
        ["Portfolio Holdings", "Yes", "No (plaintext)", "Stock symbols, quantities, costs"],
        ["Transactions", "Yes", "No (plaintext)", "Buy/sell history with prices"],
        ["Journal Entries", "Yes", "No (plaintext)", "Investment thesis, risks - potentially sensitive"],
        ["Watchlist", "Yes", "No (plaintext)", "Stock symbols with notes"],
        ["Price Alerts", "Yes", "No (plaintext)", "Target prices and directions"],
        ["Session Tokens", "Yes", "Lucia-managed", "30-day expiry, httpOnly cookies"],
    ]
    for item in privacy_items:
        privacy_data.append([Paragraph(v, styles["FindingText"]) for v in item])

    priv_table = Table(privacy_data, colWidths=[100, 45, 120, 195])
    priv_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(priv_table)
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Privacy Recommendations:</b>", styles["SubSection"]))
    privacy_recs = [
        "1. Add a Privacy Policy page informing users what data is collected and how it's used.",
        "2. Implement account deletion functionality (GDPR right to erasure).",
        "3. Add data export feature so users can download their portfolio data (GDPR data portability).",
        "4. Consider encrypting sensitive journal entries at rest.",
        "5. Add session management page where users can view and revoke active sessions.",
        "6. Implement audit logging for sensitive actions (login, data deletion, password changes).",
        "7. Database (Turso Tokyo) stores data outside the EU - consider GDPR implications for EU users.",
    ]
    for rec in privacy_recs:
        story.append(Paragraph(rec, styles["FindingText"]))
    story.append(Spacer(1, 6))

    # ==================== REMEDIATION PLAN ====================
    story.append(PageBreak())
    story.append(Paragraph("4. Remediation Priority Plan", styles["SectionTitle"]))

    plan_data = [
        [Paragraph("<b>Priority</b>", styles["BodyText2"]),
         Paragraph("<b>Finding</b>", styles["BodyText2"]),
         Paragraph("<b>Effort</b>", styles["BodyText2"]),
         Paragraph("<b>Impact</b>", styles["BodyText2"])],
    ]
    plan_items = [
        ["P0 - Immediate", "SEC-011: Rate Limiting", "2-4 hours", "Prevents brute force &amp; DoS"],
        ["P0 - Immediate", "SEC-009: Security Headers", "30 min", "Prevents clickjacking &amp; MIME attacks"],
        ["P1 - This Week", "SEC-001: Auth Rate Limiting", "1-2 hours", "Prevents credential stuffing"],
        ["P1 - This Week", "SEC-010: Remove Debug Data", "30 min", "Prevents information leakage"],
        ["P2 - This Sprint", "SEC-006: Input Validation (Zod)", "4-6 hours", "Prevents data corruption"],
        ["P2 - This Sprint", "SEC-004: Protect AI Endpoints", "1 hour", "Prevents API quota abuse"],
        ["P3 - Backlog", "SEC-012: Enable ESLint", "30 min", "Catches code quality issues"],
        ["P3 - Backlog", "SEC-007: Drizzle Migrations", "1 hour", "Better schema management"],
        ["P3 - Backlog", "Privacy Policy &amp; GDPR", "2-4 hours", "Legal compliance"],
    ]
    for item in plan_items:
        plan_data.append([Paragraph(v, styles["FindingText"]) for v in item])

    plan_table = Table(plan_data, colWidths=[100, 165, 75, 120])
    plan_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        # P0 rows red bg
        ("BACKGROUND", (0, 1), (0, 2), RED_BG),
        # P1 rows amber bg
        ("BACKGROUND", (0, 3), (0, 4), AMBER_BG),
        # P2 rows blue bg
        ("BACKGROUND", (0, 5), (0, 6), BLUE_BG),
        # P3 rows green bg
        ("BACKGROUND", (0, 7), (0, 9), GREEN_BG),
    ]))
    story.append(plan_table)

    # ==================== CONCLUSION ====================
    story.append(Spacer(1, 20))
    story.append(Paragraph("5. Conclusion", styles["SectionTitle"]))
    story.append(Paragraph(
        "The StockPortfolio application demonstrates good security fundamentals with proper "
        "password hashing (bcrypt), parameterized queries (Drizzle ORM), framework-level XSS protection "
        "(React), and correct session management (Lucia + httpOnly cookies). These foundations are solid.",
        styles["BodyText2"]
    ))
    story.append(Paragraph(
        "However, the application has critical gaps that must be addressed before production deployment "
        "with real users: (1) Rate limiting is completely absent, exposing the app to brute-force "
        "and DoS attacks. (2) Security headers are not configured, leaving the app vulnerable to "
        "clickjacking and other browser-based attacks. (3) Input validation is insufficient, "
        "which could lead to data integrity issues.",
        styles["BodyText2"]
    ))
    story.append(Paragraph(
        "With the P0 and P1 remediation items completed (estimated 4-8 hours of work), "
        "the application's security posture would significantly improve to an acceptable level "
        "for a personal/small-team portfolio tracker.",
        styles["BodyText2"]
    ))

    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#e2e8f0")))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')} | "
        "Auditor: Claude AI QA Security Tester | Classification: CONFIDENTIAL",
        styles["Footer"]
    ))

    doc.build(story)
    print(f"PDF generated: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
