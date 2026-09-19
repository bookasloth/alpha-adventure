import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { validateLead, type LeadInput } from "@/utils/lead";
import { jsonOk, jsonFail } from "@/utils/http";

// POST /api/leads — persist a contact/enquiry submission.
// ponytail: a Route Handler (not a Server Action) because the contact form is
// injected legacy HTML (Pattern B), not a React form. When /contact is rebuilt
// as Pattern A, move this to a Server Action per docs/V2_DECISIONS.md.
// No rate limiting yet — that lands in the forms/hardening phase.
export async function POST(request: Request) {
  let body: LeadInput;
  try {
    body = (await request.json()) as LeadInput;
  } catch {
    return jsonFail("Invalid request.", "invalid_json");
  }

  const result = validateLead(body, "contact");
  if (!result.ok) return jsonFail(result.error, "validation");
  if (result.bot) return jsonOk(null); // honeypot tripped: pretend success, store nothing

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("leads").insert(result.value);

  if (error) {
    console.error("[leads] insert failed:", error.message);
    return jsonFail(
      "Could not save your message. Please try again or WhatsApp us.",
      "db_error",
      500
    );
  }

  return jsonOk(null);
}
