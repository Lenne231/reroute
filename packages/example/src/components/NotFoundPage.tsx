import { Link } from "./Link";

export function NotFoundPage({ pathname }: { pathname: string }) {
  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ marginTop: 0 }}>404</h1>
      <p>There is no route for: {pathname}</p>
      <Link href="/">Go home</Link>
    </div>
  );
}
