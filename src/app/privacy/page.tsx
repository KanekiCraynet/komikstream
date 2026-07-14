export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto p-4 prose prose-invert">
      <h1>Privacy Policy</h1>
      <p>KomikStream stores account data needed for bookmarks, reading history, and preferences.</p>
      <h2>Data stored</h2>
      <ul>
        <li>Email and Clerk user ID for login.</li>
        <li>Bookmarks and reading history for komik content.</li>
        <li>Preferences such as theme.</li>
      </ul>
      <h2>Deletion</h2>
      <p>You can delete your account from the Account page. Deletion removes stored user data, bookmarks, and history.</p>
      <h2>Tracking</h2>
      <p>Analytics and ads may be added later. Current Sprint 2 scope stores only product data listed above.</p>
    </main>
  )
}
