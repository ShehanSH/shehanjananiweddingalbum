"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/albums", label: "Album" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ivory text-brown">
      <header className="border-b border-brown/10 bg-paper/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="font-script text-2xl">Shehan & Janani</p>
            <p className="text-[10px] tracking-[0.28em] uppercase text-soft-gray">Album studio</p>
          </div>
          <nav className="flex flex-wrap gap-4 text-[11px] tracking-[0.22em] uppercase">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "pb-1",
                  pathname === link.href ? "border-b border-brown" : "text-brown-soft hover:text-brown",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/album?preview=1" className="text-sage-deep hover:text-brown">
              Preview
            </Link>
            <button type="button" onClick={logout} className="text-soft-gray hover:text-brown">
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
