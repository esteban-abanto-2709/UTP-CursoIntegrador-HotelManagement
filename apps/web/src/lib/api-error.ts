export function getApiErrorMessage(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const raw = err.response?.data?.message;
  return (Array.isArray(raw) ? raw[0] : raw) || fallback;
}
