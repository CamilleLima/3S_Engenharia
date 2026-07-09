let cleanupWheelGuard: (() => void) | null = null;

export function installNumberInputWheelGuard() {
  if (cleanupWheelGuard) {
    return cleanupWheelGuard;
  }

  const handleWheel = (event: WheelEvent) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (target.type !== "number" || document.activeElement !== target) {
      return;
    }

    target.blur();
  };

  document.addEventListener("wheel", handleWheel, {
    capture: true,
    passive: true,
  });

  cleanupWheelGuard = () => {
    document.removeEventListener("wheel", handleWheel, { capture: true });
    cleanupWheelGuard = null;
  };

  return cleanupWheelGuard;
}
