import { RtfCopySettings } from "./types";

const STYLE_EL_ID = "rtf-copy-bullet-styles";

export function injectBulletStyles(settings: RtfCopySettings): void {
  removeBulletStyles();

  const rules: string[] = [];

  if (settings.applyBulletStyleReading) {
    rules.push(
      `.markdown-preview-view ul > li { list-style-type: "${settings.bulletL1} "; }`,
      `.markdown-preview-view ul ul > li { list-style-type: "${settings.bulletL2} "; }`,
      `.markdown-preview-view ul ul ul > li { list-style-type: "${settings.bulletL3} "; }`
    );
  }

  if (settings.applyBulletStyleEditor) {
    rules.push(
      `.cm-s-obsidian .HyperMD-list-line-1 .list-bullet::after { content: "${settings.bulletL1}"; }`,
      `.cm-s-obsidian .HyperMD-list-line-2 .list-bullet::after { content: "${settings.bulletL2}"; }`,
      `.cm-s-obsidian .HyperMD-list-line-3 .list-bullet::after { content: "${settings.bulletL3}"; }`
    );
  }

  if (rules.length === 0) return;

  const style = document.createElement("style");
  style.id = STYLE_EL_ID;
  style.textContent = rules.join("\n");
  document.head.appendChild(style);
}

export function removeBulletStyles(): void {
  const existing = document.getElementById(STYLE_EL_ID);
  if (existing) existing.remove();
}
