"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddStudentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gradeBand, setGradeBand] = useState<"K-2" | "3-5" | "6-8">("3-5");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, gradeBand }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
      >
        + Add a student
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 max-w-md space-y-3">
      <h3 className="font-semibold text-white">Add a student</h3>
      <input
        required
        placeholder="Student name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <input
        required
        type="email"
        placeholder="Student email (for their own login)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <input
        required
        type="password"
        minLength={8}
        placeholder="Password (at least 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <select
        value={gradeBand}
        onChange={(e) => setGradeBand(e.target.value as "K-2" | "3-5" | "6-8")}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        <option value="K-2">K-2</option>
        <option value="3-5">3-5</option>
        <option value="6-8">6-8</option>
      </select>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 px-4 py-2 text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add student"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/15 px-4 py-2 text-slate-300 hover:bg-white/5">
          Cancel
        </button>
      </div>
    </form>
  );
}
