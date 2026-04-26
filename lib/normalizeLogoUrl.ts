export function normalizeLogoUrl(url?: string | null) {
  if (!url) return undefined;

  const trimmed = url.trim();

  // Wikimedia SVG 自動轉 PNG 預覽，避免某些裝置/元件不穩
  if (
    trimmed.includes('upload.wikimedia.org') &&
    trimmed.toLowerCase().endsWith('.svg')
  ) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
      trimmed.split('/').pop() ?? ''
    )}?width=256`;
  }

  return trimmed;
}