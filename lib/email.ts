type FamilyInviteEmail = {
  email: string;
  fullName: string;
  lovedOneName: string;
  password: string;
};

export async function sendFamilyInviteEmail({
  email,
  fullName,
  lovedOneName,
  password
}: FamilyInviteEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marshall-family-care.vercel.app";
  const loginUrl = `${siteUrl.replace(/\/$/, "")}/login`;

  if (!apiKey || !from) {
    return {
      error: "Family account created, but email was not sent because RESEND_API_KEY or EMAIL_FROM is missing in Vercel.",
      sent: false
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your Marshall Family Care Portal access",
      text: [
        `Hello ${fullName},`,
        "",
        `Marshall Family Care has created portal access for ${lovedOneName}.`,
        "",
        `Login link: ${loginUrl}`,
        `Username: ${email}`,
        `Temporary password: ${password}`,
        "",
        "Please keep this information private. If you need immediate help, call 601-442-6300.",
        "",
        "Marshall Family Care"
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #241719; line-height: 1.6;">
          <h2 style="color: #6f1d2a;">Marshall Family Care Portal</h2>
          <p>Hello ${escapeHtml(fullName)},</p>
          <p>Marshall Family Care has created portal access for <strong>${escapeHtml(lovedOneName)}</strong>.</p>
          <p><strong>Login link:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p><strong>Username:</strong> ${escapeHtml(email)}</p>
          <p><strong>Temporary password:</strong> ${escapeHtml(password)}</p>
          <p>Please keep this information private. If you need immediate help, call <strong>601-442-6300</strong>.</p>
          <p>Marshall Family Care</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      error: `Family account created, but email could not be sent: ${body}`,
      sent: false
    };
  }

  return { sent: true };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
