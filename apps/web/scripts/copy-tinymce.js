const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'node_modules', 'tinymce');
const destDir = path.join(__dirname, '..', 'public', 'tinymce');

// Check if running from root (monorepo)
const rootSrcDir = path.join(__dirname, '..', '..', '..', 'node_modules', 'tinymce');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

// Try local node_modules first, then root
let copied = copyRecursive(srcDir, destDir);
if (!copied) {
  copied = copyRecursive(rootSrcDir, destDir);
}

if (copied) {
  // Create German language file
  const langsDir = path.join(destDir, 'langs');
  if (!fs.existsSync(langsDir)) {
    fs.mkdirSync(langsDir, { recursive: true });
  }

  const germanLang = `tinymce.addI18n("de", {
  "Redo": "Wiederholen",
  "Undo": "Rückgängig",
  "Cut": "Ausschneiden",
  "Copy": "Kopieren",
  "Paste": "Einfügen",
  "Select all": "Alles auswählen",
  "New document": "Neues Dokument",
  "Ok": "Ok",
  "Cancel": "Abbrechen",
  "Bold": "Fett",
  "Italic": "Kursiv",
  "Underline": "Unterstrichen",
  "Strikethrough": "Durchgestrichen",
  "Clear formatting": "Formatierung entfernen",
  "Align left": "Linksbündig",
  "Align center": "Zentriert",
  "Align right": "Rechtsbündig",
  "Justify": "Blocksatz",
  "Bullet list": "Aufzählung",
  "Numbered list": "Nummerierte Liste",
  "Decrease indent": "Einzug verkleinern",
  "Increase indent": "Einzug vergrößern",
  "Close": "Schließen",
  "Formats": "Formate",
  "Headings": "Überschriften",
  "Heading 1": "Überschrift 1",
  "Heading 2": "Überschrift 2",
  "Heading 3": "Überschrift 3",
  "Heading 4": "Überschrift 4",
  "Heading 5": "Überschrift 5",
  "Heading 6": "Überschrift 6",
  "Paragraph": "Absatz",
  "Blockquote": "Zitat",
  "Code": "Code",
  "Insert/edit image": "Bild einfügen/bearbeiten",
  "Insert image": "Bild einfügen",
  "Image...": "Bild...",
  "Source": "Quelle",
  "Title": "Titel",
  "Alternative description": "Alternative Beschreibung",
  "Insert/edit link": "Link einfügen/bearbeiten",
  "Open link in...": "Link öffnen in...",
  "Current window": "Aktuellem Fenster",
  "New window": "Neuem Fenster",
  "Remove link": "Link entfernen",
  "Link...": "Link...",
  "Insert video": "Video einfügen",
  "Insert/edit video": "Video einfügen/bearbeiten",
  "Insert/edit media": "Medien einfügen/bearbeiten",
  "Paste your embed code below:": "Fügen Sie Ihren Einbettungscode hier ein:",
  "Embed": "Einbetten",
  "Media...": "Medien...",
  "Preview": "Vorschau",
  "Fullscreen": "Vollbild",
  "Help": "Hilfe",
  "Find and replace...": "Suchen und ersetzen...",
  "Source code": "Quellcode",
  "Insert table": "Tabelle einfügen",
  "Table": "Tabelle",
  "File": "Datei",
  "Edit": "Bearbeiten",
  "Insert": "Einfügen",
  "View": "Ansicht",
  "Format": "Format",
  "Tools": "Werkzeuge",
  "Words: {0}": "Wörter: {0}",
  "Characters": "Zeichen",
  "Save": "Speichern"
});`;

  fs.writeFileSync(path.join(langsDir, 'de.js'), germanLang);
  console.log('TinyMCE copied to public folder successfully');
} else {
  console.log('TinyMCE not found in node_modules, skipping copy');
}
