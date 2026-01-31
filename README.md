# RTF Copy — Obsidian Plugin

Copy Obsidian notes as rich text for pasting into Outlook, Teams, and other Office tools. Includes firm-style bullet formatting and table support.

## Features

### Copy Section as Rich Text

Select an H1 section from the current note and copy it as formatted HTML to your clipboard. H2-H6 headings within the section are preserved as bold headings in the output. H1 headings are treated as section boundaries and excluded from the copy.

- **Command palette**: `Copy section as rich text`
- **Reading mode**: Click the clipboard icon next to any H1 heading to copy that section directly

### Copy Selection as Rich Text

Highlight any text in the editor and copy it as formatted rich text.

- **Hotkey**: `Ctrl+Shift+C`
- **Command palette**: `Copy selection as rich text`

### Firm-Style Bullet Formatting

Replaces standard markdown bullet markers with configurable characters at each nesting level:

| Level | Default Character | Name |
|-------|-------------------|------|
| 1     | `•` (U+2022)     | Bullet |
| 2     | `–` (U+2013)     | En-dash |
| 3     | `◦` (U+25E6)     | Open circle |

Bullet styling is applied in both the Obsidian editor (live preview) and reading mode via CSS injection. The same characters are used when copying to clipboard.

### Table Support

- **Markdown tables** are converted to HTML tables with borders, bold headers, and column alignment when copied
- **Bullets inside table cells** are supported using `<br>` syntax: `- item 1<br>- item 2` renders with proper bullet characters in reading mode and on copy
- Tables are styled with inline CSS for maximum Outlook compatibility

### Paste from Outlook/Word

Automatically converts pasted Office HTML into clean markdown. When you copy content from Outlook, Word, or Teams and paste it into Obsidian, the plugin intercepts the paste, strips MSO cruft (Office XML namespaces, style blocks, conditional comments), and converts the HTML to proper markdown — including tables, lists, headings, links, and inline formatting.

Only triggers on Office-sourced HTML (detected via MSO classes and Office namespaces). Regular browser pastes are unaffected.

### Line Spacing

Blank lines in your markdown are preserved as spacing in the rich text output, matching what you see in Obsidian's reading mode. All content uses 1.5 line-height.

### Supported Markdown

| Syntax | Output |
|--------|--------|
| `**bold**` | **Bold** |
| `*italic*` | *Italic* |
| `***bold italic***` | ***Bold italic*** |
| `` `code` `` | Inline code with grey background |
| `~~strikethrough~~` | ~~Strikethrough~~ |
| `[text](url)` | Hyperlink |
| `[[page]]` | Plain text (page name) |
| `> quote` | Left-bordered blockquote |
| ` ``` ` code blocks | Monospace pre block |
| `---` | Horizontal rule |
| Tables | Bordered HTML table |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Font family | Calibri | Font used in rich text output |
| Font size | 11pt | Base font size |
| Include heading | Off | Include the H1 heading in copied output |
| L1 / L2 / L3 bullet | `•` / `–` / `◦` | Bullet character per nesting level |
| Style in editor | On | Apply bullet characters in live preview |
| Style in reading mode | On | Apply bullet characters in reading mode |
| Clean paste from Outlook/Word | On | Convert pasted Office HTML to clean markdown |

## Installation

### From source

```bash
git clone https://github.com/TharithaMurage/rtf_copy_obsidian.git
cd rtf_copy_obsidian
npm install
npm run build
```

Copy `main.js` and `manifest.json` into your vault's `.obsidian/plugins/rtf-copy/` directory, then enable **RTF Copy** in Obsidian settings.

## Development

```bash
npm run dev    # build with sourcemaps
npm run build  # production build
```

## License

MIT
