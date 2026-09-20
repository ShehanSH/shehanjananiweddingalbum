export function ErrorState({
  title = "Something went wrong",
  body = "Please try again in a moment.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h2 className="font-serif text-3xl text-brown">{title}</h2>
      <p className="mt-4 text-brown-soft/80 leading-relaxed">{body}</p>
    </div>
  );
}
