export const renderLabel = (
  label: string,
  { isActive, isNavigating }: { isActive: boolean; isNavigating: boolean },
) => {
  if (isNavigating) {
    return `${label} (loading...)`;
  }

  if (isActive) {
    return `${label} (active)`;
  }

  return label;
};
