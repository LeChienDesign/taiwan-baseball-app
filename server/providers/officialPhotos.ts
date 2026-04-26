function extractMetaContent(html: string, key: string, attr: 'property' | 'name' = 'property') {
  const regex = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const match = html.match(regex);
  return match?.[1]?.trim();
}

function isUsablePhotoUrl(url?: string) {
  if (!url) return false;

  return (
    url.startsWith('https://') &&
    !url.includes('generic') &&
    !url.includes('default') &&
    !url.includes('silhouette')
  );
}

export async function fetchOfficialPhotoUrlFromPlayerPage(playerPageUrl?: string) {
  if (!playerPageUrl) return undefined;

  const res = await fetch(playerPageUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'TaiwanBaseballApp/1.0',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch player page: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  const ogImage = extractMetaContent(html, 'og:image', 'property');
  const twitterImage = extractMetaContent(html, 'twitter:image', 'name');

  if (isUsablePhotoUrl(ogImage)) return ogImage;
  if (isUsablePhotoUrl(twitterImage)) return twitterImage;

  return undefined;
}