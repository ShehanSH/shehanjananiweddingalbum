"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FloralAccent } from "@/components/album/FloralAccent";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("That password is not correct.");
      return;
    }
    router.push(params.get("from") || "/admin");
    router.refresh();
  }

  return (
    <div className="paper-canvas flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-[2rem] bg-paper px-8 py-12 text-center shadow-xl">
        <FloralAccent className="mx-auto mb-6 h-12 w-12 text-sage/70" />
        <p className="font-script text-4xl text-brown">Shehan & Janani</p>
        <h1 className="mt-3 font-serif text-2xl">Album studio</h1>
        <label className="mt-8 block text-left text-sm">
          Password
          <input
            type="password"
            className="mt-2 w-full rounded-full border border-brown/15 bg-ivory px-4 py-3"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="mt-3 text-sm text-blush">{error}</p> : null}
        <Button className="mt-6 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Enter"}
        </Button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
