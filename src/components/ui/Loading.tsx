export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-brown/70">
      <div className="h-8 w-8 animate-spin rounded-full border border-sage/40 border-t-sage" />
      <p className="font-serif text-lg">{label}</p>
    </div>
  );
}
