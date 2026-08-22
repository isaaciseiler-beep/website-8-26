import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT || window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  });

  React.useEffect(() => {
    const widthMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const pointerMql = window.matchMedia("(hover: none) and (pointer: coarse)");
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT || pointerMql.matches);
    };
    widthMql.addEventListener("change", onChange);
    pointerMql.addEventListener("change", onChange);
    onChange();
    return () => {
      widthMql.removeEventListener("change", onChange);
      pointerMql.removeEventListener("change", onChange);
    };
  }, []);

  return isMobile;
}
