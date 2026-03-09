import Link from "next/link";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";

export default function AuthenticationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication</h1>
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        To make API calls, you will need an API key. Login and copy yours from your{" "}
        <Link href="/dashboard" className="text-[#0055ba] hover:underline">
          dashboard
        </Link>{" "}
        under Settings → API Keys.
      </p>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-800 mb-1 text-sm">Header</h3>
        <CodeBlock code={`x-api-key: mp_live_your_secret_key_here`} lang="http" />
      </div>

      <Callout type="warning">
        <strong>Keep your API key secret.</strong> Never expose it in client-side code, mobile
        apps, or version control. If compromised, rotate it immediately from your dashboard. Your
        key grants full access to all your applicants and applications.
      </Callout>
    </div>
  );
}
