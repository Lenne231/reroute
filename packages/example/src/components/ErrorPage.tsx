import { Link } from "./Link";

export function ErrorPage({ error }: { error: unknown }) {
  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
      <p>{error instanceof Error ? error.message : String(error)}</p>
      <Link href="/">Go home</Link>
    </div>
  );
}
