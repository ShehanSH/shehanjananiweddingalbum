import { resetAlbumWithoutPhotos } from "../src/lib/database/albums";

async function main() {
  const draft = await resetAlbumWithoutPhotos();
  console.log(`Cleared all photographs. Fresh two-part album draft ${draft?.id ?? ""}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .then(() => process.exit(0));
