# Automatic family notifications

## Activation status

The Gmail adapter, permission controls, delivery queue, and protected worker are implemented. Automatic sending defaults to **off**. Google Voice remains a staff-operated texting tool; this implementation does not automate its website or claim a supported Google Voice SMS API exists.

## Gmail setup still required

1. Use the approved Marshall Google account to create or select a Google Cloud project and enable Gmail API.
2. Configure an OAuth client and consent for the least-privilege `https://www.googleapis.com/auth/gmail.send` scope, with offline access. Use Google's documented authorization flow; never paste credentials into chat or source control. Address consent-screen publishing/testing restrictions before relying on unattended production delivery.
3. Store `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and the authorized sender `GMAIL_FROM` as production server environment variables. The ChatGPT Gmail connection is separate and cannot supply these app credentials.
4. `MAIL_DELIVERY_ORGANIZATION_ID` must match the Marshall organization; `CRON_SECRET` protects the worker. Redeploy after environment changes.
5. Test with an explicitly approved internal recipient, then enable automatic email in Settings → Email & text. Record each family's email permission on its case. Do not enable merely because environment variables exist: they must first be validated with an approved test.

## Delivery behavior

- Future outbound internal notification drafts created for opted-in cases are queued while organization email delivery is enabled. Existing drafts are not swept up or sent retroactively.
- The queue snapshots recipient and content. Permission and the current address are checked again when claiming work. Revoked permission or a changed address cancels the queued message.
- Staff workflow actions attempt one queued email after the response. A daily Vercel schedule is a fallback, processing one item per invocation; it is not a continuous queue drain or a five-minute retry guarantee. A separately configured authenticated scheduler can POST to `/api/notifications/process` more frequently if volume requires it. Do not expose its bearer secret in browser code.
- Temporary pre-send failures and explicit rate limits can retry up to three attempts. Network errors after sending, ambiguous provider responses, and stale in-flight jobs are held as uncertain for manual reconciliation, not blindly resent.
- “Accepted” means Gmail accepted the message, not proof of inbox delivery or reading. Review failures and uncertain entries in notification settings; compare Gmail Sent before manually resending.
- Google Voice links open the existing texting service. Staff copy/review the case message, verify the recipient, and send manually. No automated SMS provider has been purchased or configured.

## Verification

`node scripts/test-gmail-delivery.mjs` uses mocked HTTP only. `supabase/tests/email-delivery.sql` checks consent, RLS, claim exclusivity, and stale-job handling inside a rolled-back transaction. Neither sends real messages.
