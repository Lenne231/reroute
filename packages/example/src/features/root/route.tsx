import { RootLayout } from "./RootLayout";
import { getHydratedValue } from "../../ssr-cache";

async function getRootLayoutMessage() {
  console.log("Fetching root layout message...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Welcome to the reroute demo!";
}

export async function resolveRootLayout() {
  const message = await getHydratedValue(
    "root-layout-message",
    getRootLayoutMessage,
  );

  return <RootLayout message={message} />;
}
