import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { checkRateLimit } from "../../../lib/rateLimit";

const PH_PHONE_REGEX = /^(09|\+639)\d{9}$/;

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(dateStr + "T00:00:00");
  return selected < today;
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, 3, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const name = (body.name ?? "").trim();
    const contact = (body.contact ?? "").trim();
    const preferredDate = (body.preferredDate ?? "").trim();
    const concern = (body.concern ?? "").trim();

    if (!name || !contact || !preferredDate || !concern) {
      return NextResponse.json({ error: "Lahat ng field ay kinakailangan.", field: "general" }, { status: 400 });
    }

    if (name.length < 2) {
      return NextResponse.json({ error: "Pakisulat ang inyong buong pangalan.", field: "name" }, { status: 400 });
    }

    if (!PH_PHONE_REGEX.test(contact)) {
      return NextResponse.json({ error: "Format ng numero: 09XXXXXXXXX o +639XXXXXXXXX", field: "contact" }, { status: 400 });
    }

    if (isPastDate(preferredDate)) {
      return NextResponse.json({ error: "Hindi maaaring pumili ng nakaraang petsa.", field: "date" }, { status: 400 });
    }

    if (isWeekend(preferredDate)) {
      return NextResponse.json({ error: "Sarado ang PESO QC tuwing Sabado at Linggo. Pumili ng weekday.", field: "date" }, { status: 400 });
    }

    if (concern.length < 10) {
      return NextResponse.json({ error: "Pakipaliwanag nang mas detalyado ang inyong alalahanin (minimum 10 characters).", field: "concern" }, { status: 400 });
    }

    const { error } = await supabase.from("bookings").insert({
      name,
      contact,
      preferred_date: preferredDate,
      concern,
    });

    if (error) {
      console.error("Supabase booking error:", error.code);
      return NextResponse.json({ error: "Hindi ma-save ang booking. Subukan muli." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bookings API error:", error);
    return NextResponse.json({ error: "Hindi maprocess ang request. Subukan muli." }, { status: 500 });
  }
}
