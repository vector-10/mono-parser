import Link from "next/link";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";

export default function AuthenticationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication</h1>
      <p className="text-gray-600 mb-8 text-sm leading-relaxed">
        There are two credentials you need to configure before going live: an{" "}
        <strong>API key</strong> for authenticating outbound requests, and a{" "}
        <strong>webhook secret</strong> for verifying inbound events. Both are
        available in your{" "}
        <Link href="/dashboard/settings" className="text-[#0055ba] hover:underline">
          dashboard
        </Link>{" "}
        under Settings.
      </p>

      {/* ── API Key ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1">API Key</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Every request to the Mono-Parser API must include your API key in the{" "}
          <code>x-api-key</code> header. Your key is prefixed with{" "}
          <code>mp_live_</code>.
        </p>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-4">
          <h3 className="font-semibold text-gray-800 mb-1 text-sm">Request Header</h3>
          <CodeBlock code={`x-api-key: mp_live_your_secret_key_here`} lang="http" />
        </div>

        <Callout type="warning">
          <strong>Keep your API key secret.</strong> Never expose it in client-side code,
          mobile apps, or version control. If compromised, rotate it immediately from your
          dashboard. Your key grants full access to all your applicants and applications.
        </Callout>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Webhook Secret</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Every event we send to your webhook URL includes an{" "}
          <code>x-mono-signature</code> header — an HMAC-SHA256 signature of the
          raw request body, signed with your webhook secret. Verify this signature
          on every inbound event before processing it.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          Your webhook secret is available in your dashboard under Settings. It is
          shown once on generation — store it as an environment variable. If you
          lose it, rotate from the dashboard to get a new one.
        </p>
      </section>
    </div>
  );
}
