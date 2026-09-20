import assert from "node:assert/strict";

const moduleUnderTest = await import("../src/lib/gmail-delivery.ts");
const { DeliveryError, gmailReady, sendGmail } = moduleUnderTest;

const originalEnvironment = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  GMAIL_FROM: process.env.GMAIL_FROM,
};

Object.assign(process.env, {
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  GOOGLE_REFRESH_TOKEN: "refresh-token",
  GMAIL_FROM: "sender@example.com",
});

const input = {
  to: "recipient@example.com",
  subject: "Résumé — 你好",
  body: "Hello from Marshall OS.\r\nThis is a test.",
  messageId: "11111111-1111-4111-8111-111111111111",
};

function response(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return payload;
    },
  };
}

function decodeBase64Url(value) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function expectDeliveryError(error, { retryable, uncertain }) {
  assert(error instanceof DeliveryError);
  assert.equal(error.retryable, retryable);
  assert.equal(error.uncertain, uncertain);
  assert.doesNotMatch(error.message, /client-secret|refresh-token|provider|recipient|Résumé/i);
}

assert.equal(gmailReady(), true);

{
  const requests = [];
  const fetcher = async (url, init) => {
    requests.push({ url, init });
    return requests.length === 1
      ? response(200, { access_token: "access-token" })
      : response(200, { id: "gmail-provider-id" });
  };
  const result = await sendGmail(input, fetcher);
  assert.deepEqual(result, { providerId: "gmail-provider-id" });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].init.method, "POST");
  assert.match(requests[0].init.body, /client_id=client-id/);
  assert.match(requests[0].init.body, /refresh_token=refresh-token/);
  assert.equal(requests[1].init.headers.authorization, "Bearer access-token");
  const raw = JSON.parse(requests[1].init.body).raw;
  const mime = decodeBase64Url(raw);
  assert.match(mime, /From: sender@example\.com\r\n/);
  assert.match(mime, /To: recipient@example\.com\r\n/);
  assert.match(mime, /Subject: =\?UTF-8\?B\?/);
  assert.match(mime, /Message-ID: <11111111-1111-4111-8111-111111111111@marshall-os\.local>/);
  assert.match(mime, /\r\n\r\nHello from Marshall OS\.\r\nThis is a test\./);
}

{
  let calls = 0;
  await assert.rejects(
    sendGmail(input, async () => {
      calls += 1;
      throw new Error("refresh-token network details");
    }),
    (error) => {
      expectDeliveryError(error, { retryable: true, uncertain: false });
      return true;
    },
  );
  assert.equal(calls, 1);
}

{
  let calls = 0;
  await assert.rejects(
    sendGmail(input, async () => {
      calls += 1;
      return calls === 1 ? response(200, { access_token: "access-token" }) : response(503, {});
    }),
    (error) => {
      expectDeliveryError(error, { retryable: true, uncertain: true });
      return true;
    },
  );
}

{
  let calls = 0;
  await assert.rejects(
    sendGmail(input, async () => {
      calls += 1;
      if (calls === 1) return response(200, { access_token: "access-token" });
      throw new Error("send network details");
    }),
    (error) => {
      expectDeliveryError(error, { retryable: true, uncertain: true });
      return true;
    },
  );
}

{
  let calls = 0;
  await assert.rejects(
    sendGmail(input, async () => {
      calls += 1;
      return calls === 1 ? response(200, { access_token: "access-token" }) : response(429, {});
    }),
    (error) => {
      expectDeliveryError(error, { retryable: true, uncertain: false });
      return true;
    },
  );
}

for (const invalidInput of [
  { ...input, to: "one@example.com,two@example.com" },
  { ...input, subject: "Injected\r\nBcc: bad@example.com" },
  { ...input, messageId: "not-a-uuid" },
]) {
  let calls = 0;
  await assert.rejects(
    sendGmail(invalidInput, async () => {
      calls += 1;
      return response(500, {});
    }),
    (error) => {
      expectDeliveryError(error, { retryable: false, uncertain: false });
      return true;
    },
  );
  assert.equal(calls, 0);
}

const savedFrom = process.env.GMAIL_FROM;
delete process.env.GMAIL_FROM;
assert.equal(gmailReady(), false);
await assert.rejects(sendGmail(input, async () => response(200, {})), (error) => {
  expectDeliveryError(error, { retryable: false, uncertain: false });
  return true;
});
process.env.GMAIL_FROM = savedFrom;

for (const [key, value] of Object.entries(originalEnvironment)) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

console.log("gmail-delivery tests passed");
