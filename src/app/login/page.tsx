import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return <main className="loginpage"><section className="loginpanel"><div className="loginbrand"><div className="brandmark">M</div><div><h1>Marshall OS</h1><p>Private operations workspace</p></div></div><div className="loginheading"><span className="settingicon"><LockKeyhole size={20}/></span><h2>Sign in</h2><p>Use your Marshall Family Care account.</p></div><form action={signIn} className="loginform">{message && <p className="formerror">{message}</p>}<label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required/></label><button className="primary" type="submit">Sign in securely</button><Link className="forgotlink" href="/forgot-password">I forgot my password</Link></form><p className="privacy">Family and case information is available only to authorized Marshall staff.</p></section></main>;
}
