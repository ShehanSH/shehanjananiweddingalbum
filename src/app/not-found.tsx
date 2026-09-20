import Link from "next/link";
import { FloralAccent } from "@/components/album/FloralAccent";

export default function NotFound() {
  return (
    <div className="paper-canvas flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <FloralAccent className="mb-6 h-14 w-14 text-sage/60" />
      <h1 className="font-serif text-4xl text-brown">This page is not in the album</h1>
      <p className="mt-4 max-w-md text-brown-soft">Return to the wedding book to continue the story.</p>
      <Link href="/" className="mt-8 text-xs uppercase tracking-[0.3em] text-sage-deep">
        Open the album
      </Link>
    </div>
  );
}
