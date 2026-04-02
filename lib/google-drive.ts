const GOOGLE_DRIVE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;

export function extractGoogleDriveFileId(value: string): string | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (GOOGLE_DRIVE_ID_PATTERN.test(normalizedValue)) {
    return normalizedValue;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    return null;
  }

  const searchId = parsedUrl.searchParams.get("id");
  if (searchId && GOOGLE_DRIVE_ID_PATTERN.test(searchId)) {
    return searchId;
  }

  const pathMatch = parsedUrl.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (pathMatch) {
    return pathMatch[1] ?? null;
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  const lastSegment = segments.at(-1);

  if (lastSegment && GOOGLE_DRIVE_ID_PATTERN.test(lastSegment)) {
    return lastSegment;
  }

  return null;
}

export function buildGoogleDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
}

export function buildGoogleDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}
