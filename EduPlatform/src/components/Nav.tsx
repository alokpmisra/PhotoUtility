import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";

export async function Nav() {
  const session = await auth();
  const role = session?.user?.role;

  const homeHref = role === "STUDENT" ? "/dashboard" : role ? "/parent" : "/";

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href={homeHref} className="flex items-center gap-2 font-semibold text-white">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 text-sm">
            NL
          </span>
          Nimbus Learning
        </Link>
        <nav className="flex items-center gap-5">
          {session?.user ? (
            <>
              {role === "STUDENT" && (
                <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white">
                  My Learning
                </Link>
              )}
              {(role === "PARENT" || role === "TUTOR") && (
                <Link href="/parent" className="text-sm font-medium text-slate-300 hover:text-white">
                  {role === "TUTOR" ? "My Students" : "My Children"}
                </Link>
              )}
              <span className="hidden sm:inline text-sm text-slate-500">{session.user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white">
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-gradient-to-br from-teal-500 to-violet-600 text-white px-3.5 py-1.5 rounded-lg hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
