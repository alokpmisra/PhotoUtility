import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PracticeClient } from "@/components/PracticeClient";

export default async function PracticePage({ params }: { params: Promise<{ skillId: string }> }) {
  const { skillId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/parent");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) notFound();

  return <PracticeClient skillId={skill.id} skillName={skill.name} />;
}
