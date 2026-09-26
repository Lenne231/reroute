import { RootLayout } from "./RootLayout";

export async function resolveRootLayout() {
  console.log("Resolve root layout");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const message = "Welcome to the reroute demo!";

  return <RootLayout message={message} />;
}
