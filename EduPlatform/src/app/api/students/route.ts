import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const addStudentSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  gradeBand: z.enum(["K-2", "3-5", "6-8"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["PARENT", "TUTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only parent or tutor accounts can add students" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = addStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, email, password, gradeBand } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const student = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "STUDENT",
      studentProfile: { create: { gradeBand } },
      guardians: { connect: [{ id: session.user.id }] },
    },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ ok: true, student });
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !["PARENT", "TUTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { guardianOf: { include: { studentProfile: true } } },
  });

  return NextResponse.json({
    students: (me?.guardianOf ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      gradeBand: s.studentProfile?.gradeBand,
    })),
  });
}
