import { App, PluginSettingTab, Setting } from "obsidian";
import type RtfCopyPlugin from "./main";

export class RtfCopySettingTab extends PluginSettingTab {
  plugin: RtfCopyPlugin;

  constructor(app: App, plugin: RtfCopyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Rich Text Copy" });

    new Setting(containerEl)
      .setName("Font family")
      .setDesc("Font used in rich text output")
      .addText((text) =>
        text.setValue(this.plugin.settings.fontFamily).onChange(async (v) => {
          this.plugin.settings.fontFamily = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Font size (pt)")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.fontSize)).onChange(async (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n) && n > 0) {
            this.plugin.settings.fontSize = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Include heading in copy")
      .setDesc("Whether to include the H1 heading itself in copied output")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.includeHeading).onChange(async (v) => {
          this.plugin.settings.includeHeading = v;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("h2", { text: "Bullet Styling" });

    new Setting(containerEl)
      .setName("Level 1 bullet")
      .addText((text) =>
        text.setValue(this.plugin.settings.bulletL1).onChange(async (v) => {
          this.plugin.settings.bulletL1 = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Level 2 bullet")
      .addText((text) =>
        text.setValue(this.plugin.settings.bulletL2).onChange(async (v) => {
          this.plugin.settings.bulletL2 = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Level 3 bullet")
      .addText((text) =>
        text.setValue(this.plugin.settings.bulletL3).onChange(async (v) => {
          this.plugin.settings.bulletL3 = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Style bullets in editor")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.applyBulletStyleEditor).onChange(async (v) => {
          this.plugin.settings.applyBulletStyleEditor = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Style bullets in reading mode")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.applyBulletStyleReading).onChange(async (v) => {
          this.plugin.settings.applyBulletStyleReading = v;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("h2", { text: "Paste from Outlook" });

    new Setting(containerEl)
      .setName("Clean paste from Outlook/Word")
      .setDesc("Automatically convert pasted Office HTML to clean markdown (requires restart to toggle)")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.cleanPasteFromOutlook).onChange(async (v) => {
          this.plugin.settings.cleanPasteFromOutlook = v;
          await this.plugin.saveSettings();
        })
      );
  }
}
