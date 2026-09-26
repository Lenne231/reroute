export const getLinkClassName = ({
  isActive,
  isNavigating,
}: {
  isActive: boolean;
  isNavigating: boolean;
}) =>
  [
    "nav-link",
    isActive ? "nav-link-active" : "",
    isNavigating ? "nav-link-pending" : "",
  ]
    .filter(Boolean)
    .join(" ");
