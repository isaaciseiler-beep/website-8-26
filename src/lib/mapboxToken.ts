export const getMapboxToken = () =>
  [
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    import.meta.env.VITE_MAPBOX_TOKEN,
    import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    import.meta.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    import.meta.env.MAPBOX_ACCESS_TOKEN,
  ].find((token): token is string => typeof token === "string" && token.trim().length > 0)?.trim() ?? "";
