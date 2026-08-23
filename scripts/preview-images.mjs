export const previewImageOptions = [
  {
    url: "https://www.isaacseiler.xyz/webpreview-linkedin.png",
    width: 1200,
    height: 630,
    type: "image/png",
    alt: "Isaac Seiler site preview",
  },
];

export const pickPreviewImage = () =>
  previewImageOptions[Math.floor(Math.random() * previewImageOptions.length)];
