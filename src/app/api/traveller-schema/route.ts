import { NextRequest, NextResponse } from "next/server";
import { introspectTravellerSchema, getTravellerAuthToken } from "@/lib/traveller/client";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const authToken = getTravellerAuthToken(
    (name) => request.cookies.get(name)?.value
  );

  if (!authToken) {
    return NextResponse.json(
      { error: "No auth_token cookie found. Log in via Holiday Extras OTP first." },
      { status: 401 }
    );
  }

  const result = await introspectTravellerSchema(authToken);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result.data);
}
