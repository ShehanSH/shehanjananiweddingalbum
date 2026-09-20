import { FloralAccent, FloralCorner } from "./FloralAccent";

export function AlbumSection({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle?: string | null;
  description?: string | null;
}) {
  return (
    <div className="album-page flex h-full flex-col items-center justify-center px-5 text-center sm:px-8">
      <FloralCorner className="absolute left-5 top-5 h-20 w-20 text-blush/50" />
      {/* <p className="text-[11px] tracking-[0.4em] uppercase text-sage">Two parts of our story</p> */}
      <h2 className="mt-6 font-serif text-4xl tracking-[0.18em] text-brown sm:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-5 font-script text-3xl text-brown-soft">{subtitle}</p> : null}
      {description ? (
        <p className="mt-8 max-w-xs font-serif text-lg italic text-brown-soft/80">{description}</p>
      ) : null}
      <FloralAccent className="mt-10 h-12 w-12 text-sage/50" />
    </div>
  );
}
