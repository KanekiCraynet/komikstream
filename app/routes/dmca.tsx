export function meta() {
  return [{ title: "DMCA — KomikStream" }];
}

export default function DmcaPage() {
  return (
    <main className="max-w-3xl mx-auto p-4 prose prose-invert">
      <h1>DMCA Notice</h1>
      <p>
        KomikStream respects intellectual property rights. If you believe
        content on this site infringes your copyright, send a notice to{" "}
        <strong>dmca@komikstream.space</strong> with:
      </p>
      <ul>
        <li>Identification of the copyrighted work claimed to be infringed.</li>
        <li>URL of the infringing material on KomikStream.</li>
        <li>Your contact information (email, address, phone).</li>
        <li>
          A statement that you have a good-faith belief the use is not
          authorised.
        </li>
        <li>
          A statement, under penalty of perjury, that the information is
          accurate and you are the rights holder or an agent.
        </li>
        <li>Your physical or electronic signature.</li>
      </ul>
      <p>
        We respond to valid DMCA takedown notices promptly. Repeat infringers
        may have their accounts terminated.
      </p>
    </main>
  );
}
