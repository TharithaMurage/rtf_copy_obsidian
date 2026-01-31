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

    // Blank line
    if (line.trim() === "") {
      // flush (no-op for flat rendering)
      continue;
    }

    // Headings (## and below, since H1 is the section boundary)
    const headingMatch = line.match(/^(#{2,6})\s+(.+)$/);
    if (headingMatch) {
      // flush (no-op for flat rendering)
      const level = headingMatch[1].length;
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

    // Unordered list items — rendered as flat <p> tags for Outlook compatibility
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ulMatch) {
      const spaces = ulMatch[1].length;
      const depth = spaces < 2 ? 0 : spaces < 4 ? 1 : 2;
      const content = ulMatch[2];
      const bullets = [settings.bulletL1, settings.bulletL2, settings.bulletL3];
      const bullet = bullets[Math.min(depth, 2)];
      const indent = "&nbsp;&nbsp;&nbsp;&nbsp;".repeat(depth);

      htmlParts.push(
        `<p style="margin:2px 0;">${indent}${bullet}&nbsp;${inlineFormat(content)}</p>`
      );
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      // flush (no-op for flat rendering)
      htmlParts.push(`<p style="margin:2px 0;margin-left:20px;">${inlineFormat(olMatch[2])}</p>`);
      continue;
    }

    // Plain paragraph
    // flush (no-op for flat rendering)
    htmlParts.push(`<p style="margin:4px 0;">${inlineFormat(line)}</p>`);
  }

  // flush (no-op for flat rendering)

  const body = htmlParts.join("\n");
  return `<div style="font-family:${settings.fontFamily},sans-serif;font-size:${settings.fontSize}pt;">${body}</div>`;
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
