"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function updatePassword(formData: FormData) {
 const preferredName=String(formData.get("preferred_name")??"").trim().replace(/\s+/g," ");
 const password=String(formData.get("password")??"");
 const confirmation=String(formData.get("confirm_password")??"");
 if(preferredName.length<2||preferredName.length>100)redirect("/reset-password?message=Enter the name you would like us to display.");
 if(password.length<10)redirect("/reset-password?message=Use at least 10 characters for your password.");
 if(password!==confirmation)redirect("/reset-password?message=The passwords do not match.");
 const supabase=await createClient();
 const {error}=await supabase.auth.updateUser({password,data:{full_name:preferredName}});
 if(error)redirect(`/reset-password?message=${encodeURIComponent(error.message)}`);
 const {error:profileError}=await supabase.rpc("update_own_profile",{preferred_name:preferredName});
 if(profileError)redirect(`/reset-password?message=${encodeURIComponent("Your password was saved, but your display name could not be updated. Please try again.")}`);
 redirect("/?account=ready");
}
