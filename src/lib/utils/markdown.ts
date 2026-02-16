const JSON_STRING_PATTERN = /^"(?:\\.|[^"\\])*"$/;

export const normalizeMarkdownSource = (source: string): string => {
  if (!source) return '';

  const trimmed = source.trim();
  const looksSerialized = JSON_STRING_PATTERN.test(trimmed);
  const hasEscapedMarkdownDelimiters = /\\[*_`~\[\]()#>!-]/.test(trimmed);

  if (!looksSerialized || !hasEscapedMarkdownDelimiters) {
    return source;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === 'string' ? parsed : source;
  } catch {
    return source;
  }
};
