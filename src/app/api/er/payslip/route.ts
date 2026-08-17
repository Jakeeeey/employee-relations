import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "vos_access_token";

// Helper to decode JWT without verification
function decodeJwt(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        let s = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (s.length % 4) s += "=";
        const json = Buffer.from(s, "base64").toString("utf8");
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwt(token);
    const userId = payload?.id || payload?.user_id || payload?.sub;

    if (!userId) {
        return NextResponse.json({ ok: false, message: "Invalid session" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const password = body?.password;

    if (!password) {
        return NextResponse.json({ ok: false, message: "Password is required" }, { status: 400 });
    }

    const directusBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const directusToken = process.env.DIRECTUS_STATIC_TOKEN;
    const springBaseUrl = process.env.SPRING_API_BASE_URL;

    if (!directusBaseUrl || !directusToken || !springBaseUrl) {
        return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
    }

    try {
        // 1. Get the user's email from Directus to verify against the auth server
        const userRes = await fetch(`${directusBaseUrl}/items/user/${userId}?fields=user_email,user_fname,user_lname,user_department`, {
            headers: { "Authorization": `Bearer ${directusToken}` },
            next: { revalidate: 0 }
        });

        if (!userRes.ok) {
            return NextResponse.json({ ok: false, message: "Failed to fetch user details" }, { status: 500 });
        }

        const userData = await userRes.json();
        const email = userData?.data?.user_email;

        if (!email) {
            return NextResponse.json({ ok: false, message: "User email not found" }, { status: 400 });
        }

        // 2. Verify password via Spring Auth Server
        const loginUrl = `${springBaseUrl.replace(/\/$/, "")}/auth/login`;
        const springRes = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ email, hashPassword: password }),
            cache: "no-store",
        });

        if (!springRes.ok) {
            return NextResponse.json({ ok: false, message: "Incorrect password." }, { status: 401 });
        }

        // 3. Password is correct. Fetch the latest payslip for this user.
        const query = {
            filter: { user_id: { _eq: userId } },
            sort: ["-created_at"], // Sort by descending date to get the latest
            limit: 1
        };

        const payslipRes = await fetch(`${directusBaseUrl}/items/payroll_run_employee?filter=${encodeURIComponent(JSON.stringify(query.filter))}&sort=${encodeURIComponent(query.sort.join(","))}&limit=1&fields=*.*`, {
            headers: { "Authorization": `Bearer ${directusToken}` },
            next: { revalidate: 0 }
        });

        if (!payslipRes.ok) {
            return NextResponse.json({ ok: false, message: "Failed to fetch payslip data." }, { status: 500 });
        }

        const payslipData = await payslipRes.json();
        const latestPayslip = payslipData?.data?.[0];

        if (!latestPayslip) {
            return NextResponse.json({ ok: false, message: "No payslip found for this user" }, { status: 404 });
        }

        // 4. Optionally fetch company profile (for the header)
        const companyRes = await fetch(`${directusBaseUrl}/items/company_profile?limit=1`, {
            headers: { "Authorization": `Bearer ${directusToken}` },
            next: { revalidate: 0 }
        });
        const companyData = companyRes.ok ? await companyRes.json() : null;
        const company = companyData?.data?.[0] || null;

        return NextResponse.json({
            ok: true,
            data: {
                employee: {
                    ...latestPayslip,
                    first_name: userData?.data?.user_fname,
                    last_name: userData?.data?.user_lname,
                    department: userData?.data?.user_department
                },
                run: latestPayslip.payroll_run_id,
                company
            }
        });

    } catch (error: unknown) {
        console.error("[Payslip API Error]:", error);
        const errMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, message: `Internal server error: ${errMessage}` }, { status: 500 });
    }
}
