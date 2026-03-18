import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const url = process.env.HX_TRAVELLER_API_URL || process.env.TRAVELLER_API_URL;
  if (!url) {
    return NextResponse.json({ error: "No traveller API URL configured" }, { status: 500 });
  }

  // Collect all cookies from the request to try different auth strategies
  const allCookies = request.headers.get("cookie") ?? "";
  const bearerToken = request.cookies.get("hx_bearer_token")?.value;
  const tripSession = request.cookies.get("_tripapplite_session")?.value;
  const authSession = request.cookies.get("auth_session")?.value;

  // Try multiple auth strategies and report what works
  const results: Record<string, unknown> = {};

  const strategies: [string, Record<string, string>][] = [
    ["bearer_to_dock_yard", {
      "Content-Type": "application/json",
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    }],
    ["cookie_all_to_dock_yard", {
      "Content-Type": "application/json",
      Cookie: allCookies,
    }],
    ["cookie_session_to_dock_yard", {
      "Content-Type": "application/json",
      ...(tripSession ? { Cookie: `_tripapplite_session=${tripSession}` } : {}),
    }],
  ];

  // Also try www.holidayextras.com
  const hxUrl = process.env.TRAVELLER_API_URL;
  if (hxUrl && hxUrl !== url) {
    strategies.push(
      ["bearer_to_hx_gateway", {
        "Content-Type": "application/json",
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      }],
      ["cookie_all_to_hx_gateway", {
        "Content-Type": "application/json",
        Cookie: allCookies,
      }],
    );
  }

  const query = `query { getTraveller { upcomingTrips { id name from to } } }`;

  for (const [name, headers] of strategies) {
    const targetUrl = name.includes("hx_gateway") ? hxUrl! : url;
    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      const hasError = !!json.errors?.length;
      const errorMsg = json.errors?.[0]?.message;
      const hasData = !!json.data?.getTraveller;
      results[name] = { status: res.status, hasData, hasError, errorMsg: errorMsg ?? null };
      if (hasData) {
        results[name] = { ...results[name] as object, data: json.data };
      }
    } catch (err) {
      results[name] = { error: err instanceof Error ? err.message : "Unknown" };
    }
  }

  return NextResponse.json({
    urls: { dock_yard: url, hx_gateway: hxUrl },
    tokens: {
      bearerToken: bearerToken ? `${bearerToken.substring(0, 20)}... (${bearerToken.length} chars)` : null,
      tripSession: tripSession ? `${tripSession.substring(0, 20)}... (${tripSession.length} chars)` : null,
      authSession: authSession ? `${authSession.substring(0, 20)}... (${authSession.length} chars)` : null,
    },
    results,
  });
}
