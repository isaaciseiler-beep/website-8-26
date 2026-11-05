/// <reference types="vite/client" />

declare const __SITE_BUILD_DATE__: string;

declare namespace React {
  interface ImgHTMLAttributes<T> {
    fetchpriority?: "high" | "low" | "auto";
  }
}
