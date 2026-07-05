import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["STUDENT", "PARENT", "TUTOR"]),
  gradeBand: z.enum(["K-2", "3-5", "6-8"]).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, email, password, role, gradeBand } = parsed.data;

  if (role === "STUDENT" && !gradeBand) {
    return NextResponse.json({ error: "gradeBand is required for student accounts" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      studentProfile:
        role === "STUDENT" && gradeBand
          ? { create: { gradeBand } }
          : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
