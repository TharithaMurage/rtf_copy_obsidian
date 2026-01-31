export interface RtfCopySettings {
  fontFamily: string;
  fontSize: number;
  includeHeading: boolean;
  bulletL1: string;
  bulletL2: string;
  bulletL3: string;
  applyBulletStyleEditor: boolean;
  applyBulletStyleReading: boolean;
}

export const DEFAULT_SETTINGS: RtfCopySettings = {
  fontFamily: "Calibri",
  fontSize: 11,
  includeHeading: false,
  bulletL1: "\u2022", // •
  bulletL2: "\u2013", // –
  bulletL3: "\u25E6", // ◦
  applyBulletStyleEditor: true,
  applyBulletStyleReading: true,
};
