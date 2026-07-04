/**
 * Compute a human-readable accessor path (e.g. `product[0].gkAttributes.crmOrderNum`)
 * for the JSON node located at a given character `offset` inside a
 * pretty-printed JSON string.
 *
 * This is a lightweight, single-pass scanner — it does NOT build an AST. It
 * tracks a stack of object/array frames while walking characters up to the
 * offset, then renders the path from that stack. Good enough for a cursor
 * breadcrumb; not a validating parser.
 */

interface Frame {
  type: 'object' | 'array';
  key: string | null;
  index: number;
  expectKey: boolean;
}

const IDENT_RE = /^[A-Za-z_$][\w$]*$/;

export function jsonPathAtOffset(text: string, offset: number): string {
  if (!text) return 'root';

  const stack: Frame[] = [];
  const limit = Math.max(0, Math.min(offset, text.length));
  let i = 0;

  while (i < limit) {
    const ch = text[i];

    if (ch === '"') {
      // Read a full JSON string token (handles escapes).
      i++;
      let str = '';
      while (i < text.length) {
        const c = text[i];
        if (c === '\\') {
          str += text[i + 1] ?? '';
          i += 2;
          continue;
        }
        if (c === '"') {
          i++;
          break;
        }
        str += c;
        i++;
      }
      const top = stack[stack.length - 1];
      if (top && top.type === 'object' && top.expectKey) {
        top.key = str;
        top.expectKey = false;
      }
      continue;
    }

    switch (ch) {
      case '{':
        stack.push({ type: 'object', key: null, index: -1, expectKey: true });
        i++;
        break;
      case '[':
        stack.push({ type: 'array', key: null, index: 0, expectKey: false });
        i++;
        break;
      case '}':
      case ']':
        stack.pop();
        i++;
        break;
      case ',': {
        const top = stack[stack.length - 1];
        if (top) {
          if (top.type === 'object') {
            top.expectKey = true;
            top.key = null;
          } else {
            top.index++;
          }
        }
        i++;
        break;
      }
      default:
        i++;
    }
  }

  if (stack.length === 0) return 'root';

  let path = '';
  for (const frame of stack) {
    if (frame.type === 'array') {
      path += `[${Math.max(frame.index, 0)}]`;
    } else if (frame.key !== null) {
      if (IDENT_RE.test(frame.key)) {
        path += path ? `.${frame.key}` : frame.key;
      } else {
        path += `[${JSON.stringify(frame.key)}]`;
      }
    }
  }

  return path || 'root';
}
