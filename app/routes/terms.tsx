export function meta() {
  return [{ title: "Terms of Service — KomikStream" }];
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto p-4 prose prose-invert">
      <h1>Terms of Service</h1>
      <p>By using KomikStream, you agree to these terms.</p>
      <h2>Use</h2>
      <ul>
        <li>Content is for personal, non-commercial use only.</li>
        <li>You must not scrape, republish, or redistribute content.</li>
        <li>
          Account registration is optional; you are responsible for account
          security.
        </li>
      </ul>
      <h2>Content</h2>
      <ul>
        <li>
          KomikStream aggregates publicly available content from third-party
          sources.
        </li>
        <li>We do not host any copyrighted content on our servers.</li>
        <li>Trademarks belong to their respective owners.</li>
      </ul>
      <h2>Limitation of Liability</h2>
      <p>
        Service provided &quot;as is&quot;. We are not liable for damages from
        use or inability to use the service.
      </p>
      <h2>Changes</h2>
      <p>
        Terms may change; continued use after changes constitutes acceptance.
      </p>
      <h2>Contact</h2>
      <p>
        Questions: <a href="/contact">contact page</a>.
      </p>
    </main>
  );
}
