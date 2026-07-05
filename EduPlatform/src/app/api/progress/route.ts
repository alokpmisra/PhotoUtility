import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStudentDashboard } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedStudentId = searchParams.get("studentId");

  let studentId: string;
  if (session.user.role === "STUDENT") {
    studentId = session.user.id;
  } else {
    if (!requestedStudentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }
    const guardianLink = await prisma.user.findFirst({
      where: { id: session.user.id, guardianOf: { some: { id: requestedStudentId } } },
    });
    if (!guardianLink) {
      return NextResponse.json({ error: "Not authorized to view this student" }, { status: 403 });
    }
    studentId = requestedStudentId;
  }

  const dashboard = await getStudentDashboard(studentId);
  return NextResponse.json(dashboard);
}
