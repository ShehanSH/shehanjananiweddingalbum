"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";

type Stats = {
  totalPhotos: number;
  weddingShootPhotos: number;
  weddingDayPhotos: number;
  totalPages: number;
  draftPages: number;
  publishedPages: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  if (error) return <ErrorState title="Dashboard unavailable" body="The studio could not load album statistics." />;
  if (!stats) return <Loading label="Opening the studio" />;

  const cards = [
    { label: "Total photographs", value: stats.totalPhotos },
    { label: "Couple Shoot", value: stats.weddingShootPhotos },
    { label: "Wedding Function", value: stats.weddingDayPhotos },
    { label: "Album pages", value: stats.totalPages },
  ];

  return (
    <div>
      <h1 className="font-serif text-4xl">Dashboard</h1>
      <p className="mt-2 text-brown-soft">Draft {stats.draftPages} pages · Published {stats.publishedPages} pages</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl bg-paper p-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-soft-gray">{card.label}</p>
            <p className="mt-3 font-serif text-4xl">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-4 text-sm uppercase tracking-[0.18em]">
        <Link href="/admin/photos" className="rounded-full bg-brown px-5 py-3 text-ivory">
          Manage photos
        </Link>
        <Link href="/admin/albums" className="rounded-full border border-brown/20 px-5 py-3">
          Edit album
        </Link>
      </div>
    </div>
  );
}
