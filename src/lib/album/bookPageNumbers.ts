type NumberedPage = {
  id: string;
  sectionId?: string | null;
};

export function albumPageNumberForDraft(pages: NumberedPage[], pageId: string) {
  let bookPage = 2;
  let lastSection: string | null | undefined;
  let started = false;

  for (const page of pages) {
    if (!started || page.sectionId !== lastSection) {
      bookPage += 1;
      lastSection = page.sectionId;
      started = true;
    }
    bookPage += 1;
    if (page.id === pageId) return bookPage;
  }

  return bookPage;
}

export function padImageSlots(ids: string[], slots: number) {
  return Array.from({ length: slots }, (_, index) => ids[index] || "");
}
