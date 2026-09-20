export const LAYOUT_TYPES = [
  "HERO_PORTRAIT",
  "HERO_LANDSCAPE",
  "FULL_BLEED_IMAGE",
  "TWO_PORTRAITS",
  "THREE_PORTRAITS",
  "FOUR_PORTRAITS",
  "TWO_LANDSCAPES",
  "THREE_LANDSCAPES",
  "FOUR_LANDSCAPES",
  "LANDSCAPE_PLUS_PORTRAIT",
  "PORTRAIT_PLUS_TWO",
  "ASYMMETRIC_EDITORIAL",
  "LARGE_PLUS_SMALL",
  "PHOTO_STORY",
  "WHITE_SPACE_EDITORIAL",
] as const;

export type LayoutType = (typeof LAYOUT_TYPES)[number];

export type PhotoOrientation = "PORTRAIT" | "LANDSCAPE" | "SQUARE";

export interface EnginePhoto {
  id: string;
  width: number;
  height: number;
  orientation: PhotoOrientation;
  aspectRatio: number;
  isHero?: boolean;
}

export interface LayoutDefinition {
  type: LayoutType;
  label: string;
  slots: number;
  preferred: Array<PhotoOrientation | "ANY">;
  allowMixed: boolean;
  family: "portrait" | "landscape" | "mixed" | "hero";
}

export const LAYOUT_LIBRARY: Record<LayoutType, LayoutDefinition> = {
  HERO_PORTRAIT: {
    type: "HERO_PORTRAIT",
    label: "Hero portrait",
    slots: 1,
    preferred: ["PORTRAIT"],
    allowMixed: true,
    family: "hero",
  },
  HERO_LANDSCAPE: {
    type: "HERO_LANDSCAPE",
    label: "Hero landscape",
    slots: 1,
    preferred: ["LANDSCAPE"],
    allowMixed: true,
    family: "hero",
  },
  FULL_BLEED_IMAGE: {
    type: "FULL_BLEED_IMAGE",
    label: "Full-bleed image",
    slots: 1,
    preferred: ["ANY"],
    allowMixed: true,
    family: "hero",
  },
  TWO_PORTRAITS: {
    type: "TWO_PORTRAITS",
    label: "Two portraits",
    slots: 2,
    preferred: ["PORTRAIT", "PORTRAIT"],
    allowMixed: false,
    family: "portrait",
  },
  THREE_PORTRAITS: {
    type: "THREE_PORTRAITS",
    label: "Three portraits",
    slots: 3,
    preferred: ["PORTRAIT", "PORTRAIT", "PORTRAIT"],
    allowMixed: false,
    family: "portrait",
  },
  FOUR_PORTRAITS: {
    type: "FOUR_PORTRAITS",
    label: "Four portraits",
    slots: 4,
    preferred: ["PORTRAIT", "PORTRAIT", "PORTRAIT", "PORTRAIT"],
    allowMixed: false,
    family: "portrait",
  },
  TWO_LANDSCAPES: {
    type: "TWO_LANDSCAPES",
    label: "Two landscapes",
    slots: 2,
    preferred: ["LANDSCAPE", "LANDSCAPE"],
    allowMixed: false,
    family: "landscape",
  },
  THREE_LANDSCAPES: {
    type: "THREE_LANDSCAPES",
    label: "Three landscapes",
    slots: 3,
    preferred: ["LANDSCAPE", "LANDSCAPE", "LANDSCAPE"],
    allowMixed: false,
    family: "landscape",
  },
  FOUR_LANDSCAPES: {
    type: "FOUR_LANDSCAPES",
    label: "Four landscapes",
    slots: 4,
    preferred: ["LANDSCAPE", "LANDSCAPE", "LANDSCAPE", "LANDSCAPE"],
    allowMixed: false,
    family: "landscape",
  },
  LANDSCAPE_PLUS_PORTRAIT: {
    type: "LANDSCAPE_PLUS_PORTRAIT",
    label: "Landscape + portrait",
    slots: 2,
    preferred: ["LANDSCAPE", "PORTRAIT"],
    allowMixed: true,
    family: "mixed",
  },
  PORTRAIT_PLUS_TWO: {
    type: "PORTRAIT_PLUS_TWO",
    label: "Portrait + two",
    slots: 3,
    preferred: ["PORTRAIT", "ANY", "ANY"],
    allowMixed: true,
    family: "mixed",
  },
  ASYMMETRIC_EDITORIAL: {
    type: "ASYMMETRIC_EDITORIAL",
    label: "Asymmetric editorial",
    slots: 3,
    preferred: ["ANY", "ANY", "ANY"],
    allowMixed: true,
    family: "mixed",
  },
  LARGE_PLUS_SMALL: {
    type: "LARGE_PLUS_SMALL",
    label: "Large + small",
    slots: 2,
    preferred: ["ANY", "ANY"],
    allowMixed: true,
    family: "mixed",
  },
  PHOTO_STORY: {
    type: "PHOTO_STORY",
    label: "Photo story",
    slots: 4,
    preferred: ["ANY", "ANY", "ANY", "ANY"],
    allowMixed: true,
    family: "mixed",
  },
  WHITE_SPACE_EDITORIAL: {
    type: "WHITE_SPACE_EDITORIAL",
    label: "Whitespace editorial",
    slots: 1,
    preferred: ["ANY"],
    allowMixed: true,
    family: "hero",
  },
};

export const PORTRAIT_RHYTHM: LayoutType[] = [
  "HERO_PORTRAIT",
  "TWO_PORTRAITS",
  "WHITE_SPACE_EDITORIAL",
  "THREE_PORTRAITS",
  "HERO_PORTRAIT",
  "TWO_PORTRAITS",
  "FULL_BLEED_IMAGE",
  "PORTRAIT_PLUS_TWO",
  "LARGE_PLUS_SMALL",
  "HERO_PORTRAIT",
  "TWO_PORTRAITS",
  "ASYMMETRIC_EDITORIAL",
];

export const LANDSCAPE_RHYTHM: LayoutType[] = [
  "HERO_LANDSCAPE",
  "TWO_LANDSCAPES",
  "FULL_BLEED_IMAGE",
  "LANDSCAPE_PLUS_PORTRAIT",
  "HERO_LANDSCAPE",
  "TWO_LANDSCAPES",
  "LARGE_PLUS_SMALL",
  "THREE_LANDSCAPES",
  "WHITE_SPACE_EDITORIAL",
  "HERO_LANDSCAPE",
  "TWO_LANDSCAPES",
];

export const MIXED_RHYTHM: LayoutType[] = [
  "HERO_PORTRAIT",
  "LANDSCAPE_PLUS_PORTRAIT",
  "TWO_PORTRAITS",
  "HERO_LANDSCAPE",
  "WHITE_SPACE_EDITORIAL",
  "LARGE_PLUS_SMALL",
  "TWO_LANDSCAPES",
  "PORTRAIT_PLUS_TWO",
  "FULL_BLEED_IMAGE",
];
