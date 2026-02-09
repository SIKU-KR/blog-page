/**
 * AI Service
 * OpenAI-powered text generation for summaries, slugs, and translations
 */
import OpenAI from 'openai';

const MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface SummaryResponse {
  summary: string;
}

export interface SlugResponse {
  slug: string;
}

export interface TranslationResponse {
  title: string;
  content: string;
  summary: string | null;
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate a summary for blog post content
   */
  async generateSummary(text: string): Promise<SummaryResponse> {
    const response = await this.callOpenAI([
      {
        role: 'system',
        content: `You are a professional blog editor. Generate a concise, engaging summary for the given blog post content.
The summary should:
- Be 2-3 sentences long (maximum 200 characters)
- Capture the main topic and key points
- Be written in the same language as the original content
- Be engaging and informative for readers

Return only the summary text, nothing else.`,
      },
      { role: 'user', content: text },
    ]);

    return { summary: response.trim() };
  }

  /**
   * Generate a URL-friendly slug from title and content
   */
  async generateSlug(title: string, content: string): Promise<SlugResponse> {
    const response = await this.callOpenAI([
      {
        role: 'system',
        content: `You are a SEO expert. Generate a URL-friendly slug for the given blog post.
The slug should:
- Be in English (transliterate if the title is in another language)
- Use lowercase letters, numbers, and hyphens only
- Be 3-6 words long, separated by hyphens
- Be descriptive and SEO-friendly
- Not include stop words (the, a, an, is, are, etc.) unless necessary for meaning
- Maximum 60 characters

Return only the slug, nothing else.`,
      },
      { role: 'user', content: `Title: ${title}\n\nContent preview: ${content.slice(0, 500)}` },
    ]);

    const slug = this.sanitizeSlug(response.trim());
    return { slug };
  }

  /**
   * Translate a post from Korean to English
   */
  async translatePost(
    title: string,
    content: string,
    summary: string | null
  ): Promise<TranslationResponse> {
    const [translatedTitle, translatedContent, translatedSummary] = await Promise.all([
      this.translate(title, 'title'),
      this.translate(content, 'content'),
      summary ? this.translate(summary, 'summary') : Promise.resolve(null),
    ]);

    return {
      title: translatedTitle,
      content: translatedContent,
      summary: translatedSummary,
    };
  }

  private async translate(text: string, type: 'title' | 'content' | 'summary'): Promise<string> {
    const systemPrompts: Record<string, string> = {
      title: 'Translate Korean to English. Output only the translation.',
      content:
        'Translate Korean technical blog to English. Preserve Markdown formatting, URLs, code blocks.',
      summary: 'Translate Korean to English. Max 200 characters. Output only the translation.',
    };

    const response = await this.callOpenAI(
      [
        { role: 'system', content: systemPrompts[type] },
        { role: 'user', content: text },
      ],
      type === 'content' ? 8192 : 256
    );

    return response.trim();
  }

  private async callOpenAI(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens = 200
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: MODEL,
          messages,
          max_tokens: maxTokens,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No content in OpenAI response');
        }

        return content;
      } catch (error) {
        lastError = error as Error;
        if (attempt < MAX_RETRIES - 1) {
          await this.delay(RETRY_DELAY_MS * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Failed to call OpenAI API');
  }

  private sanitizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiService = new AIService();
