export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const yamlBlock = match[1];
  const content = match[2].trim();
  const data: Record<string, unknown> = {};

  const lines = yamlBlock.split("\n");
  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const line of lines) {
    const arrayItem = line.match(/^  - (.+)$/);
    if (arrayItem && currentKey && currentArray) {
      currentArray.push(arrayItem[1].trim());
      continue;
    }

    if (currentKey && currentArray) {
      data[currentKey] = currentArray;
      currentKey = null;
      currentArray = null;
    }

    const keyValue = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!keyValue) continue;

    const key = keyValue[1];
    const value = keyValue[2].trim();

    if (value === "") {
      currentKey = key;
      currentArray = [];
    } else if (value === "true") {
      data[key] = true;
    } else if (value === "false") {
      data[key] = false;
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      data[key] = Number(value);
    } else {
      data[key] = value.replace(/^["']|["']$/g, "");
    }
  }

  if (currentKey && currentArray) {
    data[currentKey] = currentArray;
  }

  return { data, content };
}

export function serializeFrontmatter(
  data: Record<string, unknown>,
  body: string,
): string {
  const lines: string[] = ["---"];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}:`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${item}`);
        }
      }
    } else if (typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
    } else if (value === null || value === undefined || value === "") {
      lines.push(`${key}: ""`);
    } else {
      const str = String(value);
      const needsQuotes = /[:#\[\]{},&*!|>'"%@`]/.test(str) || str.includes("\n");
      lines.push(needsQuotes ? `${key}: "${str.replace(/"/g, '\\"')}"` : `${key}: ${str}`);
    }
  }

  lines.push("---");
  return `${lines.join("\n")}\n\n${body}`;
}
