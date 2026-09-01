export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `Empty response from ${response.url || "API"} (${response.status})`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid JSON from ${response.url || "API"} (${response.status})`
    );
  }
}

export async function fetchJsonApi<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, init);
  const payload = await parseJsonResponse<{ data?: T; error?: string }>(
    response
  );

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  return payload.data as T;
}
