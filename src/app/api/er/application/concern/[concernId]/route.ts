import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConcernService } from "@/modules/er/application/concern/services/concernService";
import { UpdateConcernSchema } from "@/modules/er/application/concern/type";
import { ZodError } from "zod";

const COOKIE_NAME = "vos_access_token";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ concernId: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const { concernId } = await params;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = UpdateConcernSchema.parse(body);

    const updatedConcern = await ConcernService.update(parseInt(concernId), validatedData);
    return NextResponse.json({ ok: true, data: updatedConcern });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
