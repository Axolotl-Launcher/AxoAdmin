import { NextResponse } from "next/server";
import { authFailure, getAdminSession } from "@/lib/auth/access";

export async function GET(request: Request) {
  try {
    return NextResponse.json(await getAdminSession(request.headers));
  } catch (error) {
    return authFailure(error);
  }
}
