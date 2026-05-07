import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

function verifyPassword(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === process.env.ADMIN_PASSWORD;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyPassword(req)) {
    return NextResponse.json({ error: "Mali ang password." }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!["pending", "confirmed", "done"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Admin status update error:", error.code);
    return NextResponse.json({ error: "Hindi ma-update ang status." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
