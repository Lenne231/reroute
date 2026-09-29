import { renderApp } from "./routes";

export async function resolveStatusCode(url: string): Promise<number> {
  return (await renderApp(new URL(url, "http://localhost").pathname))
    .statusCode;
}
