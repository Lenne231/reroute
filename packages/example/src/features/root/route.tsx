import type { ReactNode } from "react";
import { RootLayout } from "./RootLayout";

export async function resolveRootLayout({ children }: { children: ReactNode }) {
  console.log("Resolve root layout");
  //await new Promise((resolve) => setTimeout(resolve, 1000));
  const message = "Welcome to the reroute demo!";

  return <RootLayout message={message}>{children}</RootLayout>;
}

export default resolveRootLayout;
