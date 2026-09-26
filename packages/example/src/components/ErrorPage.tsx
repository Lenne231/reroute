import { Link } from "reroute";

export function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
      <p>{error instanceof Error ? error.message : String(error)}</p>
      <button type="button" onClick={retry} style={{ marginRight: "0.75rem" }}>
        Retry
      </button>
      <Link to="/">Go home</Link>
    </div>
  );
}
