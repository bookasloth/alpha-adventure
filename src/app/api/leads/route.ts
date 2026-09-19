import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { validateLead, type LeadInput } from "@/utils/lead";

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
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const result = validateLead(body, "contact");
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  if (result.bot) {
    // Honeypot tripped: pretend success, store nothing.
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("leads").insert(result.value);

  if (error) {
    console.error("[leads] insert failed:", error.message);
    return NextResponse.json(
      { ok: false, error: "Could not save your message. Please try again or WhatsApp us." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
