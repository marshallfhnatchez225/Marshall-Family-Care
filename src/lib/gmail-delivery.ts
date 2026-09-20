const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SEND_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const REQUEST_TIMEOUT_MS = 15_000;

export type GmailDeliveryInput = {
  to: string;
  subject: string;
  body: string;
  messageId: string;
};

export type GmailResponseFetcher = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

/** A delivery failure safe for queue code to classify without exposing provider details. */
export class DeliveryError extends Error {
  readonly retryable: boolean;
  readonly uncertain: boolean;

  constructor(message: string, options: { retryable: boolean; uncertain: boolean }) {
    super(message);
    this.name = "DeliveryError";
    this.retryable = options.retryable;
    this.uncertain = options.uncertain;
  }
}

const hasRequiredConfiguration = () =>
  Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GMAIL_FROM,
  );

export function gmailReady(): boolean {
  return hasRequiredConfiguration();
}

function fail(
  message: string,
  retryable: boolean,
  uncertain = false,
): DeliveryError {
  return new DeliveryError(message, { retryable, uncertain });
}

function isSingleEmailAddress(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 320 &&
    !/[\r\n]/.test(value) &&
    !/[\s,;<>]/.test(value) &&
    /^[^@]+@[^@]+$/.test(value)
  );
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function base64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodedSubject(subject: string): string {
  const encoded = Buffer.from(subject, "utf8").toString("base64");
  return `=?UTF-8?B?${encoded}?=`;
}

function timeoutError(operation: "token" | "send", error: unknown): DeliveryError {
  // Keep network/provider exception text out of the queue and user-facing logs.
  void error;
  return operation === "token"
    ? fail("Gmail authentication could not be reached", true)
    : fail("Gmail delivery outcome is uncertain", true, true);
}

async function fetchBounded(
  fetcher: GmailResponseFetcher,
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const operation = (async () => {
    const response = await fetcher(url, { ...init, signal: controller.signal });

    // Buffer the body before clearing the timer. A successful fetch can still
    // hang while reading the response stream, especially on a stalled proxy.
    const body =
      typeof response.text === "function"
        ? await response.text()
        : JSON.stringify(await response.json());
    return new Response(body, {
      status: response.status,
      headers: response.headers,
    });
  })();

  const timeout = new Promise<Response>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Gmail request timed out"));
    }, REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function classifyHttpFailure(
  operation: "token" | "send",
  status: number,
): DeliveryError {
  if (status === 429) {
    return fail(
      operation === "token"
        ? "Gmail authentication is temporarily rate limited"
        : "Gmail delivery is temporarily rate limited",
      true,
    );
  }

  if (status >= 500 && status <= 599) {
    return operation === "token"
      ? fail("Gmail authentication is temporarily unavailable", true)
      : fail("Gmail delivery outcome is uncertain", true, true);
  }

  return operation === "token"
    ? fail("Gmail authentication was rejected", false)
    : fail("Gmail rejected the message", false);
}

async function refreshAccessToken(
  fetcher: GmailResponseFetcher,
): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw fail("Gmail delivery is not configured", false);
  }

  let response: Response;
  try {
    response = await fetchBounded(fetcher, TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });
  } catch (error) {
    throw timeoutError("token", error);
  }

  if (!response.ok) {
    throw classifyHttpFailure("token", response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw fail("Gmail authentication response was invalid", false);
  }

  const accessToken =
    typeof payload === "object" && payload !== null && "access_token" in payload
      ? (payload as { access_token?: unknown }).access_token
      : undefined;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw fail("Gmail authentication response was invalid", false);
  }
  return accessToken;
}

function validateInput(input: GmailDeliveryInput, from: string): void {
  if (!input || typeof input !== "object") {
    throw fail("Invalid Gmail message", false);
  }
  if (!isSingleEmailAddress(input.to) || !isSingleEmailAddress(from)) {
    throw fail("Invalid Gmail address", false);
  }
  if (typeof input.subject !== "string" || /[\r\n]/.test(input.subject)) {
    throw fail("Invalid Gmail subject", false);
  }
  if (typeof input.body !== "string") {
    throw fail("Invalid Gmail body", false);
  }
  if (!isUuid(input.messageId)) {
    throw fail("Invalid Gmail message id", false);
  }
}

function buildMime(input: GmailDeliveryInput, from: string): string {
  return [
    `From: ${from}`,
    `To: ${input.to}`,
    `Subject: ${encodedSubject(input.subject)}`,
    `Message-ID: <${input.messageId}@marshall-os.local>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.body,
  ].join("\r\n");
}

/**
 * Send one message through Gmail. This adapter intentionally performs no retry:
 * callers must reconcile uncertain outcomes before attempting another delivery.
 */
export async function sendGmail(
  input: GmailDeliveryInput,
  fetcher: GmailResponseFetcher = fetch,
): Promise<{ providerId: string }> {
  const from = process.env.GMAIL_FROM;
  if (!from) {
    throw fail("Gmail delivery is not configured", false);
  }
  validateInput(input, from);

  const accessToken = await refreshAccessToken(fetcher);
  let response: Response;
  try {
    response = await fetchBounded(fetcher, SEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ raw: base64Url(buildMime(input, from)) }),
    });
  } catch (error) {
    throw timeoutError("send", error);
  }

  if (!response.ok) {
    throw classifyHttpFailure("send", response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw fail("Gmail delivery outcome is uncertain", true, true);
  }
  const providerId =
    typeof payload === "object" && payload !== null && "id" in payload
      ? (payload as { id?: unknown }).id
      : undefined;
  if (typeof providerId !== "string" || providerId.length === 0) {
    throw fail("Gmail delivery outcome is uncertain", true, true);
  }
  return { providerId };
}
