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

        <div className="bg-gray-50 border border-gray-200 p-5 mb-4">
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
          <code>x-signature</code> header — an HMAC-SHA256 signature of the
          raw request body, signed with your webhook secret. Verify this signature
          on every inbound event before processing it.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Your webhook secret is available in your dashboard under Settings. It is
          shown once on generation — store it as an environment variable. If you
          lose it, rotate from the dashboard to get a new one.
        </p>

        <h3 className="font-semibold text-gray-800 text-sm mb-2">Verifying the signature</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          Compute an HMAC-SHA256 of the <strong>raw request body</strong> (the unparsed JSON string)
          using your webhook secret, hex-encode the result, and compare it against the{" "}
          <code>x-signature</code> header. Use a timing-safe comparison to prevent timing attacks.
        </p>

        <CodeBlock
          lang="javascript"
          code={`import crypto from 'crypto';
import express from 'express';

const app = express();

// Use express.raw() on this route to receive the unparsed body as a Buffer
app.post('/webhooks/mono-parser', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-signature'];
  const secret    = process.env.MONO_PARSER_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body) // req.body must be the raw Buffer, not parsed JSON
    .digest('hex');

  const sigBuffer      = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(req.body.toString());
  // process event.event, event.data ...
  res.status(200).end();
});`}
        />

        <Callout type="warning">
          Always use the <strong>raw request body</strong> — not the parsed JSON object — when
          computing the signature. Parsing and re-stringifying the body can change whitespace or
          key ordering and will cause the comparison to fail even with a valid secret.
        </Callout>
      </section>
    </div>
  );
}
