import { Plugin } from "obsidian";
import { RtfCopySettings } from "./types";

export function registerTablePostProcessor(plugin: Plugin, settings: RtfCopySettings): void {
  plugin.registerMarkdownPostProcessor((element) => {
    const cells = element.querySelectorAll("table td, table th");
    cells.forEach((cell) => {
      processTableCell(cell as HTMLElement, settings);
    });
  });
}

function processTableCell(cell: HTMLElement, settings: RtfCopySettings): void {
  const html = cell.innerHTML;
  const parts = html.split(/<br\s*\/?>/i);
  if (parts.length < 2 && !parts[0].match(/^\s*[-*+]\s+/)) return;

  const processed = parts.map((part) => {
    const trimmed = part.trimStart();
    const match = trimmed.match(/^[-*+]\s+(.+)$/);
    if (!match) return part;

    const leadingSpaces = part.length - trimmed.length;
    const depth = leadingSpaces < 2 ? 0 : leadingSpaces < 4 ? 1 : 2;
    const bullets = [settings.bulletL1, settings.bulletL2, settings.bulletL3];
    return `${bullets[depth]}&nbsp;${match[1]}`;
  });

  cell.innerHTML = processed.join("<br>");
}
