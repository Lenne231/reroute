type InitialLoadingScreenProps = {
  message?: string;
  fullScreen?: boolean;
};

export function InitialLoadingScreen({
  message = "Loading app",
  fullScreen = true,
}: InitialLoadingScreenProps) {
  return (
    <div
      style={{
        minHeight: fullScreen ? "100vh" : "10rem",
        display: "grid",
        placeItems: "center",
        background: fullScreen
          ? "radial-gradient(circle at 20% 20%, #fef3c7 0%, #ffffff 45%, #e0f2fe 100%)"
          : "transparent",
        color: "#0f172a",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          justifyItems: "center",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "9999px",
            border: "4px solid #0f172a22",
            borderTopColor: "#0f172a",
            animation: "reroute-initial-spin 0.8s linear infinite",
          }}
        />
        <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
          {message}
        </p>
      </div>
      <style>{`@keyframes reroute-initial-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
