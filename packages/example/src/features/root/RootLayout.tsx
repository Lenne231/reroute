import type { ReactNode } from "react";

export function RootLayout({
  message,
  children,
}: {
  message: string;
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>reroute example</title>
        <style>
          {
            "@keyframes reroute-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } body { margin: 0; font-family: 'Avenir Next', 'Segoe UI', sans-serif; background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%); color: #111827; } .page-shell { min-height: 100vh; padding: 2rem; box-sizing: border-box; } .nav-link { color: #1d4ed8; text-decoration: none; } .nav-link:hover { text-decoration: underline; } .nav-link-active { color: #111827; font-weight: 700; } .nav-link-pending { opacity: 0.6; }"
          }
        </style>
      </head>
      <body>
        <div className="page-shell">
          <p>{message}</p>
          {children}
        </div>
      </body>
    </html>
  );
}
