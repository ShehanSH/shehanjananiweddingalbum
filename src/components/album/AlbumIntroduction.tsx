import { COUPLE, INTRO_COPY } from "@/lib/constants";
import { FloralAccent } from "./FloralAccent";

export function AlbumIntroduction() {
  return (
    <div className="album-page flex h-full flex-col items-center justify-center px-5 text-center sm:px-10">
      <FloralAccent className="mb-8 h-14 w-14 text-sage/60" />
      <p className="max-w-sm whitespace-pre-line font-serif text-2xl leading-relaxed text-brown sm:text-3xl">
        {INTRO_COPY.introduction}
      </p>
      <p className="mt-10 font-script text-4xl text-brown">
        {COUPLE.groom} & {COUPLE.bride}
      </p>
      <p className="mt-4 text-xs tracking-[0.32em] uppercase text-soft-gray">{COUPLE.weddingDate}</p>
    </div>
  );
}
