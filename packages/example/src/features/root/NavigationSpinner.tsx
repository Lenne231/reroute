import { useIsNavigating } from "reroute";

export function NavigationSpinner() {
  const isNavigating = useIsNavigating();

  if (!isNavigating) {
    return null;
  }

  return (
    <div
      aria-label="Loading"
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "3px solid #d1d5db",
        borderTopColor: "#111827",
        animation: "reroute-spin 0.8s linear infinite",
      }}
    />
  );
}
