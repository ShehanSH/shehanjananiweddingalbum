"use client";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading } from "@/components/ui/Loading";
import { FormEvent, useEffect, useState } from "react";

type Section = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
};

export default function AdminSettingsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ slug: "", title: "", subtitle: "", description: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setSections(data.sections);
        setLoaded(true);
      })
      .catch(() => setError(true));
  }, []);

  async function addSection(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: form }),
    });
    if (!response.ok) {
      setMessage("Could not add that section.");
      return;
    }
    const section = await response.json();
    setSections((current) => [...current, section]);
    setForm({ slug: "", title: "", subtitle: "", description: "" });
    setMessage("Section added. Future albums can include it.");
  }

  if (error) return <ErrorState title="Settings unavailable" />;
  if (!loaded) return <Loading />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Settings</h1>
        <p className="mt-2 text-brown-soft">
          Sections can grow beyond the wedding shoot and wedding day — reception, family, honeymoon and more.
        </p>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <li key={section.id} className="rounded-3xl bg-paper p-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-soft-gray">{section.slug}</p>
            <h2 className="mt-2 font-serif text-2xl">{section.title}</h2>
            <p className="mt-2 text-sm text-brown-soft">{section.description}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={addSection} className="max-w-xl space-y-3 rounded-3xl bg-paper p-6">
        <h2 className="font-serif text-2xl">Add a section</h2>
        <input
          className="w-full rounded-full border border-brown/15 bg-ivory px-4 py-2"
          placeholder="Slug (reception)"
          value={form.slug}
          onChange={(event) => setForm({ ...form, slug: event.target.value })}
          required
        />
        <input
          className="w-full rounded-full border border-brown/15 bg-ivory px-4 py-2"
          placeholder="Title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
        <input
          className="w-full rounded-full border border-brown/15 bg-ivory px-4 py-2"
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
        />
        <textarea
          className="w-full rounded-3xl border border-brown/15 bg-ivory px-4 py-2"
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <Button>Add section</Button>
        {message ? <p className="text-sm text-sage-deep">{message}</p> : null}
      </form>
    </div>
  );
}
