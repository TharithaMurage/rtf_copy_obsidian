/**
 * Converts HTML (particularly from Outlook/Word) into clean markdown.
 * Strips MSO cruft, converts tables, lists, inline formatting.
 */
export function htmlToMarkdown(html: string): string {
  html = stripMsoCruft(html);

  const doc = new DOMParser().parseFromString(html, "text/html");
  return convertNode(doc.body).trim();
}

function stripMsoCruft(html: string): string {
  // Remove Office XML namespaced tags: <o:p>, <w:sdt>, <v:shape>, etc.
  html = html.replace(/<\/?[ovwm]:[^>]*>/gi, "");
  // Remove MSO conditional comments
  html = html.replace(/<!--\[if[^]*?<!\[endif\]-->/gi, "");
  // Remove XML declarations and processing instructions
  html = html.replace(/<\?xml[^>]*>/gi, "");
  // Remove <style> blocks (Outlook injects massive style blocks)
  html = html.replace(/<style[^>]*>[^]*?<\/style>/gi, "");
  // Remove <meta> and <link> tags
  html = html.replace(/<meta[^>]*>/gi, "");
  html = html.replace(/<link[^>]*>/gi, "");
  return html;
}

function convertNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return cleanText(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // Skip invisible/empty Office elements
  if (tag === "head" || tag === "script" || tag === "style") return "";

  switch (tag) {
    case "b":
    case "strong":
      return `**${convertChildren(el).trim()}**`;

    case "i":
    case "em":
      return `*${convertChildren(el).trim()}*`;

    case "u":
      return convertChildren(el);

    case "s":
    case "strike":
    case "del":
      return `~~${convertChildren(el).trim()}~~`;

    case "a": {
      const href = el.getAttribute("href") || "";
      const text = convertChildren(el).trim();
      if (!href || href.startsWith("mailto:") && text === href.replace("mailto:", "")) {
        return text;
      }
      return `[${text}](${href})`;
    }

    case "code":
      return `\`${convertChildren(el).trim()}\``;

    case "pre": {
      const code = convertChildren(el).trim();
      return `\n\`\`\`\n${code}\n\`\`\`\n`;
    }

    case "br":
      return "\n";

    case "hr":
      return "\n---\n";

    case "h1":
      return `\n# ${convertChildren(el).trim()}\n`;
    case "h2":
      return `\n## ${convertChildren(el).trim()}\n`;
    case "h3":
      return `\n### ${convertChildren(el).trim()}\n`;
    case "h4":
      return `\n#### ${convertChildren(el).trim()}\n`;
    case "h5":
      return `\n##### ${convertChildren(el).trim()}\n`;
    case "h6":
      return `\n###### ${convertChildren(el).trim()}\n`;

    case "p":
    case "div": {
      const content = convertChildren(el).trim();
      if (!content) return "\n";
      // Detect Outlook's MsoListParagraph for bullet items
      const cls = el.getAttribute("class") || "";
      if (cls.includes("MsoListParagraph") || cls.includes("x_MsoListParagraph")) {
        return `\n- ${cleanListContent(content)}`;
      }
      return `\n${content}\n`;
    }

    case "blockquote": {
      const lines = convertChildren(el).trim().split("\n");
      return "\n" + lines.map((l) => `> ${l}`).join("\n") + "\n";
    }

    case "ul":
      return convertList(el, "-");

    case "ol":
      return convertList(el, "1.");

    case "li": {
      const content = convertChildren(el).trim();
      // Depth is handled by the parent list converter
      return content;
    }

    case "table":
      return convertTable(el);

    case "img": {
      const alt = el.getAttribute("alt") || "";
      const src = el.getAttribute("src") || "";
      if (src) return `![${alt}](${src})`;
      return "";
    }

    case "span": {
      // Outlook wraps everything in <span> with MSO styles — just pass through
      return convertChildren(el);
    }

    default:
      return convertChildren(el);
  }
}

function convertChildren(el: HTMLElement): string {
  let result = "";
  for (const child of Array.from(el.childNodes)) {
    result += convertNode(child);
  }
  return result;
}

function convertList(el: HTMLElement, marker: string): string {
  const items = Array.from(el.children).filter(
    (c) => c.tagName.toLowerCase() === "li"
  );
  let result = "\n";
  for (let i = 0; i < items.length; i++) {
    const li = items[i] as HTMLElement;
    const prefix = marker === "1." ? `${i + 1}.` : marker;
    const content = convertListItem(li);
    result += `${prefix} ${content}\n`;
  }
  return result;
}

function convertListItem(li: HTMLElement): string {
  let text = "";
  const subLists: string[] = [];

  for (const child of Array.from(li.childNodes)) {
    const el = child as HTMLElement;
    if (el.tagName && (el.tagName.toLowerCase() === "ul" || el.tagName.toLowerCase() === "ol")) {
      // Nested list — indent each line
      const nested = convertNode(el).trim().split("\n");
      subLists.push(...nested.map((l) => `  ${l}`));
    } else {
      text += convertNode(child);
    }
  }

  let result = text.trim();
  if (subLists.length > 0) {
    result += "\n" + subLists.join("\n");
  }
  return result;
}

function convertTable(tableEl: HTMLElement): string {
  const rows: string[][] = [];
  const trElements = tableEl.querySelectorAll("tr");

  for (const tr of Array.from(trElements)) {
    const cells: string[] = [];
    const cellElements = tr.querySelectorAll("td, th");
    for (const cell of Array.from(cellElements)) {
      const text = convertChildren(cell as HTMLElement).trim().replace(/\n/g, "<br>");
      cells.push(text);
    }
    if (cells.length > 0) rows.push(cells);
  }

  if (rows.length === 0) return "";

  const colCount = Math.max(...rows.map((r) => r.length));

  // Normalize all rows to same column count
  for (const row of rows) {
    while (row.length < colCount) row.push("");
  }

  const header = rows[0];
  const separator = header.map(() => "---");
  const dataRows = rows.slice(1);

  let md = "\n";
  md += `| ${header.join(" | ")} |\n`;
  md += `| ${separator.join(" | ")} |\n`;
  for (const row of dataRows) {
    md += `| ${row.join(" | ")} |\n`;
  }
  return md;
}

function cleanText(text: string): string {
  // Replace non-breaking spaces with regular spaces
  text = text.replace(/\u00A0/g, " ");
  // Collapse multiple spaces
  text = text.replace(/ {2,}/g, " ");
  return text;
}

function cleanListContent(text: string): string {
  // Outlook list paragraphs often start with a bullet char + spaces
  return text.replace(/^[\u2022\u2013\u25E6\u00B7·•–◦]\s*/, "").trim();
}
