# Google Voice browser delivery

Intake records the family name, email, and mobile number first. Selecting **Send documents through Google Voice** creates a private packet link and queues the exact text for a browser send. The queue persists across page refreshes.

Marshall OS uses an auditable queue plus the signed-in Marshall Google Voice browser. It does not store Google credentials or expose a public sending endpoint.

## Delivery sequence

1. A signed-in staff member selects first-call documents and chooses **Send documents through Google Voice** in Intake.
2. The database transaction creates one private portal link, one communication, and one queued delivery. Repeated clicks return the existing delivery.
3. The local Codex task claims the delivery, rechecks the current case stage, phone number, and private-link validity, and then starts the browser attempt.
4. The task sends the exact queued message through `marshallfhnatchez225@gmail.com` and verifies that the outgoing message appears in Google Voice.
5. Only a verified result marks the communication sent and moves the case from Intake to Arrangement.

## Failure rules

- A claim has a ten-minute lease. An expired claim becomes `uncertain`; it is never automatically retried.
- Once browser sending begins, an interruption becomes `uncertain`, because the final click may have succeeded.
- Staff must inspect Google Voice and resolve an uncertain delivery as sent or unsent.
- A changed phone number, expired/revoked link, or case that left Intake cancels the queued job before browser work.
- Cancelling or confirming an unsent attempt revokes that private portal link. A new packet can then be queued.

## Local requirement

The Codex task must be active to complete a browser send; the website cannot send through Google Voice by itself. Use the signed-in Marshall Google Voice browser. Inspect any queued or uncertain job in Marshall OS and Google Voice before resolving it. Do not assume a queued job was delivered.
