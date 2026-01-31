import { MarkdownPostProcessorContext, Plugin } from "obsidian";
import { RtfCopySettings } from "./types";
import { markdownToHtml } from "./markdown-to-html";
import { parseSections } from "./section-modal";

export function registerHeadingCopyButtons(plugin: Plugin, settings: RtfCopySettings): void {
  plugin.registerMarkdownPostProcessor((element: HTMLElement, context: MarkdownPostProcessorContext) => {
    const headings = element.querySelectorAll("h1");
    headings.forEach((h1) => {
      if (h1.querySelector(".rtf-copy-btn")) return;

      const btn = document.createElement("span");
      btn.className = "rtf-copy-btn";
      btn.setAttribute("aria-label", "Copy as rich text");
      btn.style.cssText =
        "cursor:pointer;opacity:0.4;margin-left:6px;font-size:0.6em;vertical-align:middle;";
      btn.textContent = "\u{1F4CB}"; // clipboard emoji
      btn.addEventListener("mouseenter", () => { btn.style.opacity = "1"; });
      btn.addEventListener("mouseleave", () => { btn.style.opacity = "0.4"; });

      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const headingText = h1.textContent?.replace("\u{1F4CB}", "").trim() || "";

        const file = plugin.app.workspace.getActiveFile();
        if (!file) return;

        const text = await plugin.app.vault.cachedRead(file);
        const sections = parseSections(text);
        const section = sections.find((s) => s.heading === headingText);
        if (!section) return;

        let md = section.content;
        if (settings.includeHeading) {
          md = `## ${section.heading}\n\n${md}`;
        }

        const html = markdownToHtml(md, settings);
        try {
          const blob = new Blob([html], { type: "text/html" });
          const plainBlob = new Blob([html.replace(/<[^>]+>/g, "")], { type: "text/plain" });
          await navigator.clipboard.write([
            new ClipboardItem({ "text/html": blob, "text/plain": plainBlob }),
          ]);
          const { Notice } = await import("obsidian");
          new Notice(`Copied section: ${headingText}`);
        } catch {
          const { Notice } = await import("obsidian");
          new Notice("Failed to copy to clipboard");
        }
      });

      h1.appendChild(btn);
    });
  });
}
