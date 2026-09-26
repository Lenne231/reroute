export async function resolveFailRoute(): Promise<never> {
  console.log("Resolve fail route");
  await new Promise((resolve) => setTimeout(resolve, 700));
  throw new Error("Intentional demo error from /fail");
}
