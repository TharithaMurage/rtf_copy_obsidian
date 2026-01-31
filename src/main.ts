import { Notice, Plugin } from "obsidian";
import { RtfCopySettings, DEFAULT_SETTINGS } from "./types";
import { markdownToHtml } from "./markdown-to-html";
import { parseSections, SectionSuggestModal } from "./section-modal";
import { injectBulletStyles, removeBulletStyles } from "./bullet-styles";
import { RtfCopySettingTab } from "./settings-tab";
import { registerTablePostProcessor } from "./table-post-processor";

export default class RtfCopyPlugin extends Plugin {
  settings: RtfCopySettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: "copy-section-rich-text",
      name: "Copy section as rich text",
      callback: () => this.copySectionAsRichText(),
    });

    this.addSettingTab(new RtfCopySettingTab(this.app, this));
    injectBulletStyles(this.settings);
    registerTablePostProcessor(this, this.settings);
  }

  onunload(): void {
    removeBulletStyles();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    injectBulletStyles(this.settings);
  }

  private copySectionAsRichText(): void {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice("No active file");
      return;
    }

    const content = this.app.vault.cachedRead(file).then((text) => {
      const sections = parseSections(text);
      if (sections.length === 0) {
        new Notice("No H1 sections found in this note");
        return;
      }

      new SectionSuggestModal(this.app, sections, (section) => {
        let md = section.content;
        if (this.settings.includeHeading) {
          md = `## ${section.heading}\n\n${md}`;
        }

        const html = markdownToHtml(md, this.settings);
        this.copyHtmlToClipboard(html, section.heading);
      }).open();
    });
  }

  private async copyHtmlToClipboard(html: string, heading: string): Promise<void> {
    try {
      const blob = new Blob([html], { type: "text/html" });
      const plainBlob = new Blob([html.replace(/<[^>]+>/g, "")], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": plainBlob,
        }),
      ]);
      new Notice(`Copied section: ${heading}`);
    } catch {
      new Notice("Failed to copy to clipboard");
    }
  }
}
