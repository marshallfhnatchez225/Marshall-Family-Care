import Link from "next/link";
import { Mail } from "lucide-react";
import { sendReset } from "./actions";

export default async function ForgotPassword({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return <main className="loginpage"><section className="loginpanel"><div className="loginheading"><span className="settingicon"><Mail size={20}/></span><h1>Reset your password</h1><p>We will email a secure reset link to your Marshall account.</p></div>{sent ? <div className="resetsent"><h2>Check your email</h2><p>If that address has an account, its reset link is on the way.</p><Link className="primary" href="/login">Return to sign in</Link></div> : <form action={sendReset} className="loginform"><label>Email<input name="email" type="email" autoComplete="email" required/></label><button className="primary" type="submit">Email reset link</button><Link className="forgotlink" href="/login">Back to sign in</Link></form>}</section></main>;
}
