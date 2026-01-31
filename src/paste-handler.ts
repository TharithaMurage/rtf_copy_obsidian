import { Plugin } from "obsidian";
import { EditorView } from "@codemirror/view";
import { htmlToMarkdown } from "./html-to-markdown";

export function registerPasteHandler(plugin: Plugin): void {
  const handler = EditorView.domEventHandlers({
    paste(event: ClipboardEvent, view: EditorView) {
      const html = event.clipboardData?.getData("text/html");
      if (!html) return false;

      // Only intercept if the HTML looks like it came from an Office app or rich source
      // (contains MSO classes, Office namespace tags, or is a substantial HTML document)
      const isOfficeHtml =
        html.includes("MsoNormal") ||
        html.includes("MsoListParagraph") ||
        html.includes("x_MsoNormal") ||
        html.includes("urn:schemas-microsoft-com:office") ||
        html.includes("xmlns:o=") ||
        html.includes("xmlns:w=");

      // Also intercept if it contains a <table> (common paste from Outlook/Excel)
      const hasTable = /<table[\s>]/i.test(html);

      if (!isOfficeHtml && !hasTable) return false;

      event.preventDefault();

      const md = htmlToMarkdown(html);
      const cleanMd = collapseBlankLines(md);

      const cursor = view.state.selection.main;
      const transaction = view.state.update({
        changes: { from: cursor.from, to: cursor.to, insert: cleanMd },
        selection: { anchor: cursor.from + cleanMd.length },
      });
      view.dispatch(transaction);

      return true;
    },
  });

  plugin.registerEditorExtension(handler);
}

function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}
