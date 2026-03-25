"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0f",
          color: "#fff",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Terjadi Kesalahan</h1>
          <div
            style={{
              background: "#1a1a2e",
              border: "1px solid #333",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.5rem",
              maxWidth: "600px",
              width: "100%",
              textAlign: "left",
              overflow: "auto",
            }}
          >
            <p
              style={{
                color: "#ff6b6b",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
            </p>
            {error.stack && (
              <pre
                style={{
                  color: "#888",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  marginTop: "0.5rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {error.stack}
              </pre>
            )}
            {error.digest && (
              <p style={{ color: "#666", fontSize: "0.75rem", marginTop: "0.5rem" }}>
                Digest: {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={reset}
            style={{
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 2rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
