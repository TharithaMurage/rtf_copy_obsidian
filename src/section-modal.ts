import { App, FuzzySuggestModal } from "obsidian";

export interface Section {
  heading: string;
  content: string;
  lineStart: number;
}

export function parseSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  const contentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^#\s+(.+)$/);
    if (match) {
      if (current) {
        current.content = contentLines.splice(0).join("\n").trim();
        sections.push(current);
      }
      current = { heading: match[1], content: "", lineStart: i };
    } else if (current) {
      contentLines.push(lines[i]);
    }
  }

  if (current) {
    current.content = contentLines.join("\n").trim();
    sections.push(current);
  }

  return sections;
}

export class SectionSuggestModal extends FuzzySuggestModal<Section> {
  private sections: Section[];
  private onSelect: (section: Section) => void;

  constructor(app: App, sections: Section[], onSelect: (section: Section) => void) {
    super(app);
    this.sections = sections;
    this.onSelect = onSelect;
    this.setPlaceholder("Select a section to copy as rich text");
  }

  getItems(): Section[] {
    return this.sections;
  }

  getItemText(section: Section): string {
    const preview = section.content.split("\n").slice(0, 2).join(" ").substring(0, 80);
    return `${section.heading}  —  ${preview}`;
  }

  onChooseItem(section: Section): void {
    this.onSelect(section);
  }
}
