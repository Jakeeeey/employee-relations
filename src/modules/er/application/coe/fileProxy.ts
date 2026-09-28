export function getFileProxyUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const encoded = encodeURIComponent(raw);
  return `/api/er/application/coe/file?path=${encoded}`;
}
