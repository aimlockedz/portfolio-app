import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - StockPortfolio",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Login
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: March 29, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold mb-3">
              1. Information We Collect
            </h2>
            <p className="mb-2">
              StockPortfolio collects only the information necessary to provide
              our portfolio tracking service:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Account Information:</strong> Email address, display
                name, and hashed password (we never store your password in
                plaintext)
              </li>
              <li>
                <strong>Portfolio Data:</strong> Stock symbols, quantities,
                purchase prices, and transaction history that you enter
              </li>
              <li>
                <strong>Watchlist & Journal:</strong> Stock watchlist entries,
                conviction levels, investment theses, and notes
              </li>
              <li>
                <strong>Price Alerts:</strong> Target prices and alert
                configurations
              </li>
              <li>
                <strong>Session Data:</strong> Authentication tokens stored as
                httpOnly cookies for secure session management
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain our portfolio tracking service</li>
              <li>To authenticate your identity and protect your account</li>
              <li>
                To generate AI-powered stock analysis using anonymized market
                data
              </li>
              <li>
                To display real-time stock quotes and financial data from
                third-party APIs
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              3. Data Storage & Security
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Data is stored in a Turso (libSQL) database hosted in the Tokyo
                region
              </li>
              <li>
                Passwords are hashed using bcrypt with a cost factor of 10
              </li>
              <li>
                Sessions use httpOnly, secure, SameSite cookies with 30-day
                expiry
              </li>
              <li>All API endpoints are protected with rate limiting</li>
              <li>
                Security headers (HSTS, CSP, X-Frame-Options) are enforced on
                all responses
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              4. Third-Party Services
            </h2>
            <p className="mb-2">
              We use the following third-party services to provide market data
              and AI analysis:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Finnhub:</strong> Real-time stock quotes, company
                profiles, analyst recommendations
              </li>
              <li>
                <strong>Yahoo Finance:</strong> Historical price data and
                financial statements
              </li>
              <li>
                <strong>Groq / Gemini AI:</strong> AI-powered stock analysis and
                news summarization (no personal data is sent to these services)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Access:</strong> View all data associated with your
                account
              </li>
              <li>
                <strong>Correction:</strong> Update your profile information at
                any time
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and
                all associated data
              </li>
              <li>
                <strong>Portability:</strong> Export your portfolio data
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              6. Cookies
            </h2>
            <p>
              We use a single essential cookie (<code>auth_session</code>) for
              authentication. We do not use tracking cookies, analytics cookies,
              or any third-party cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              7. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the &ldquo;Last updated&rdquo; date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or wish to
              exercise your data rights, please contact us through the
              application settings page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
