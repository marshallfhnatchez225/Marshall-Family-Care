import { LockKeyhole } from "lucide-react";
import { recoverAccount } from "./actions";

export default async function AccountRecovery({ searchParams }: { searchParams: Promise<{ token?: string; message?: string }> }) {
  const { token, message } = await searchParams;
  return <main className="loginpage"><section className="loginpanel"><div className="loginheading"><span className="settingicon"><LockKeyhole size={20}/></span><h1>Create a new password</h1><p>This private recovery link works once and expires shortly.</p></div>{token ? <form action={recoverAccount} className="loginform">{message && <p className="formerror">{message}</p>}<input name="token" type="hidden" value={token}/><label>New password<input name="password" type="password" autoComplete="new-password" minLength={10} required autoFocus/></label><label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={10} required/></label><button className="primary" type="submit">Save new password</button></form> : <p className="formerror">This recovery link is incomplete.</p>}</section></main>;
}
