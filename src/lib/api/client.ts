import { errorEnvelopeSchema } from "./schemas";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseError(response: Response): Promise<ApiError> {
  const json: unknown = await response.json().catch(() => null);
  const parsed = errorEnvelopeSchema.safeParse(json);
  if (parsed.success) {
    return new ApiError(parsed.data.error, response.status, parsed.data.code);
  }
  return new ApiError(response.statusText || "Request failed", response.status);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { schema: { parse: (value: unknown) => T } },
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (response.status === 204) {
    return init.schema.parse(null);
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  const json: unknown = await response.json();
  return init.schema.parse(json);
}

export async function apiJson<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
  init?: RequestInit,
): Promise<T> {
  return apiFetch(path, { ...init, schema });
}
