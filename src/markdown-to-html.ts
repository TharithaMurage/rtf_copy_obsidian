import { RtfCopySettings } from "./types";

/**
 * Minimal markdown-to-HTML converter focused on the subset needed
 * for pasting into Outlook/Teams.
 */
export function markdownToHtml(md: string, settings: RtfCopySettings): string {
  const lines = md.split("\n");
  const htmlParts: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  // No list stack needed — we render flat <p> tags for Outlook compatibility

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code blocks
    if (line.trimStart().startsWith("```")) {
      if (!inCodeBlock) {
        // flush (no-op for flat rendering)
        inCodeBlock = true;
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        htmlParts.push(
          `<pre style="background:#f4f4f4;padding:8px;font-family:Consolas,monospace;font-size:${settings.fontSize - 1}pt;border-radius:4px;">` +
            escapeHtml(codeBlockContent.join("\n")) +
            "</pre>"
        );
      }
      continue;
    }
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Blank line — preserve as spacing to match Obsidian rendering
    if (line.trim() === "") {
      htmlParts.push(`<p style="margin:0;font-size:${settings.fontSize}pt;">&nbsp;</p>`);
      continue;
    }

    // Headings — H1 lines are skipped (section boundary), H2-H6 are rendered
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (level === 1) continue; // skip H1
      const sizes: Record<number, number> = { 2: settings.fontSize + 4, 3: settings.fontSize + 2, 4: settings.fontSize + 1, 5: settings.fontSize, 6: settings.fontSize };
      const size = sizes[level] || settings.fontSize;
      htmlParts.push(`<p style="font-size:${size}pt;font-weight:bold;margin:8px 0 4px 0;">${inlineFormat(headingMatch[2])}</p>`);
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
      // flush (no-op for flat rendering)
      htmlParts.push('<hr style="border:none;border-top:1px solid #ccc;margin:8px 0;">');
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith("> ")) {
      // flush (no-op for flat rendering)
      const quoteText = line.replace(/^>\s?/, "");
      htmlParts.push(
        `<div style="border-left:3px solid #ccc;padding-left:10px;margin:4px 0;color:#555;">${inlineFormat(quoteText)}</div>`
      );
      continue;
    }

    // Unordered list items — table-based indent for Outlook compatibility
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ulMatch) {
      const spaces = ulMatch[1].length;
      const depth = spaces < 2 ? 0 : spaces < 4 ? 1 : 2;
      const content = ulMatch[2];
      const bullets = [settings.bulletL1, settings.bulletL2, settings.bulletL3];
      const bullet = bullets[Math.min(depth, 2)];
      const indentPx = depth * 24;

      if (depth === 0) {
        htmlParts.push(
          `<p style="margin:2px 0;">${bullet}&nbsp;${inlineFormat(content)}</p>`
        );
      } else {
        htmlParts.push(
          `<table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>` +
          `<td style="width:${indentPx}px;"></td>` +
          `<td style="font-family:${settings.fontFamily},sans-serif;font-size:${settings.fontSize}pt;line-height:1.5;">${bullet}&nbsp;${inlineFormat(content)}</td>` +
          `</tr></table>`
        );
      }
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      // flush (no-op for flat rendering)
      htmlParts.push(
        `<table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>` +
        `<td style="width:24px;"></td>` +
        `<td style="font-family:${settings.fontFamily},sans-serif;font-size:${settings.fontSize}pt;line-height:1.5;">${inlineFormat(olMatch[2])}</td>` +
        `</tr></table>`
      );
      continue;
    }

    // Markdown table
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|") &&
        i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const tableResult = parseTable(lines, i, settings);
      htmlParts.push(tableResult.html);
      i = tableResult.endIndex;
      continue;
    }

    // Plain paragraph
    htmlParts.push(`<p style="margin:4px 0;">${inlineFormat(line)}</p>`);
  }

  const body = htmlParts.join("\n");
  return `<div style="font-family:${settings.fontFamily},sans-serif;font-size:${settings.fontSize}pt;line-height:1.5;">${body}</div>`;
}

function parseTable(lines: string[], startIndex: number, settings: RtfCopySettings): { html: string; endIndex: number } {
  const splitRow = (row: string): string[] =>
    row.trim().slice(1, -1).split("|").map((c) => c.trim());

  const headerCells = splitRow(lines[startIndex]);

  // Parse alignments from separator row
  const sepCells = splitRow(lines[startIndex + 1]);
  const alignments = sepCells.map((s) => {
    const t = s.trim();
    if (t.startsWith(":") && t.endsWith(":")) return "center";
    if (t.endsWith(":")) return "right";
    return "left";
  });

  // Collect data rows
  const dataRows: string[][] = [];
  let endIndex = startIndex + 1;
  for (let j = startIndex + 2; j < lines.length; j++) {
    const row = lines[j].trim();
    if (row.startsWith("|") && row.endsWith("|")) {
      dataRows.push(splitRow(lines[j]));
      endIndex = j;
    } else {
      break;
    }
  }

  const cellStyle = (extra: string) =>
    `border:1px solid #d0d0d0;padding:6px 8px;font-family:${settings.fontFamily},sans-serif;font-size:${settings.fontSize}pt;${extra}`;

  const headerHtml = headerCells
    .map((cell, idx) =>
      `<th style="${cellStyle(`font-weight:bold;text-align:${alignments[idx] || "left"};`)}">${processCellContent(cell, settings)}</th>`
    ).join("");

  const bodyHtml = dataRows
    .map((row) =>
      "<tr>" + row.map((cell, idx) =>
        `<td style="${cellStyle(`text-align:${alignments[idx] || "left"};`)}">${processCellContent(cell, settings)}</td>`
      ).join("") + "</tr>"
    ).join("");

  const html =
    `<table style="border-collapse:collapse;width:100%;margin:8px 0;">` +
    `<thead><tr>${headerHtml}</tr></thead>` +
    `<tbody>${bodyHtml}</tbody></table>`;

  return { html, endIndex };
}

function processCellContent(cellText: string, settings: RtfCopySettings): string {
  if (cellText.includes("<br>")) {
    const parts = cellText.split(/<br\s*\/?>/i);
    return parts.map((part) => processSingleLine(part, settings)).join("<br>");
  }
  return processSingleLine(cellText, settings);
}

function processSingleLine(text: string, settings: RtfCopySettings): string {
  const trimmed = text.trimStart();
  const match = trimmed.match(/^[-*+]\s+(.+)$/);
  if (!match) return inlineFormat(text);

  const leadingSpaces = text.length - trimmed.length;
  const depth = leadingSpaces < 2 ? 0 : leadingSpaces < 4 ? 1 : 2;
  const bullets = [settings.bulletL1, settings.bulletL2, settings.bulletL3];
  return `${bullets[depth]}&nbsp;${inlineFormat(match[1])}`;
}

function inlineFormat(text: string): string {
  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<b><i>$1</i></b>");
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  // Italic
  text = text.replace(/\*(.+?)\*/g, "<i>$1</i>");
  // Inline code
  text = text.replace(
    /`([^`]+)`/g,
    '<span style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-family:Consolas,monospace;">$1</span>'
  );
  // Links
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:#0563C1;">$1</a>'
  );
  // Wikilinks
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  text = text.replace(/\[\[([^\]]+)\]\]/g, "$1");
  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, "<s>$1</s>");
  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
