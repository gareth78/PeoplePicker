import { getEnv } from './env';
import { log, logError } from './log';

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export type OktaFetchOptions = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  retry?: number;
  requestId?: string;
};

export type OktaFetchResult<T> = {
  data: T;
  response: Response;
};

export async function oktaFetch<T>({
  path,
  method = 'GET',
  body,
  timeoutMs = 8000,
  retry = 1,
  requestId
}: OktaFetchOptions): Promise<OktaFetchResult<T>> {
  const { OKTA_API_TOKEN, OKTA_ORG_URL } = getEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${OKTA_ORG_URL.replace(/\/$/, '')}${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `SSWS ${OKTA_API_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!response.ok) {
      const text = await safeText(response);
      const error = new Error(text || response.statusText);
      (error as Error & { status?: number }).status = response.status;
      if (shouldRetry(response.status) && retry > 0) {
        log({ message: 'Retrying Okta request', level: 'warn', status: response.status, path, method }, { requestId });
        await backoff();
        return oktaFetch<T>({ path, method, body, timeoutMs, retry: retry - 1, requestId });
      }
      throw error;
    }

    const data = (await response.json()) as T;
    return { data, response };
  } catch (error) {
    const err = error as Error & { status?: number };
    const shouldAttemptRetry = (err.name === 'AbortError' || shouldRetry(err.status)) && retry > 0;
    if (shouldAttemptRetry) {
      log({ message: 'Retrying Okta request after error', level: 'warn', path, method }, { requestId });
      await backoff();
      return oktaFetch<T>({ path, method, body, timeoutMs, retry: retry - 1, requestId });
    }
    logError(err, { message: 'Okta request failed', path, method }, { requestId });
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function shouldRetry(status?: number) {
  return typeof status === 'number' && RETRYABLE_STATUSES.has(status);
}

async function safeText(response: Response) {
  try {
    return await response.text();
  } catch (error) {
    logError(error as Error, { message: 'Failed to parse Okta error body' });
    return '';
  }
}

async function backoff() {
  await new Promise((resolve) => setTimeout(resolve, 200));
}
