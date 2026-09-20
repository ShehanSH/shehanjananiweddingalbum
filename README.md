# Shehan & Janani Wedding Album

A page-turning wedding album for Shehan and Janani. Guests can open the book at `/`. The couple manages photographs, layouts, and page order at `/admin`.

## Storage

- **Local development:** SQLite (`prisma/dev.db`) and files in `.data/uploads`.
- **Production (Vercel):** Neon Postgres for album metadata and [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for photographs. Image files are not committed to Git.

Existing local photographs are migrated with `npm run album:blob`, then page mapping is imported with `npm run album:import` against the production `DATABASE_URL`.

## Admin

Sign in at `/admin/login`. Set `ADMIN_PASSWORD` and `AUTH_SECRET` in the environment.
