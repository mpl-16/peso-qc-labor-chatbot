import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function verifyPassword(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!verifyPassword(req)) {
    return NextResponse.json({ error: "Mali ang password." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, name, contact, preferred_date, concern, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin bookings fetch error:", error.code);
    return NextResponse.json({ error: "Hindi ma-load ang mga booking." }, { status: 500 });
  }

  return NextResponse.json({ bookings: data });
}
