
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

/**
 * Singleton service for Furigana generation.
 * Wraps Kuroshiro and handles lazy initialization of the dictionary.
 */
class FuriganaService {
  private readonly kuroshiro: Kuroshiro;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    try {
      this.kuroshiro = new Kuroshiro();
    } catch (e) {
      console.error("Failed to instantiate Kuroshiro", e);
    }
  }

  /**
   * Initialize Kuroshiro with Kuromoji Analyzer.
   * Uses a public CDN for dictionary files.
   */
  async init() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!this.kuroshiro) return;
      try {
        // Check if path module is available in global scope if needed (debug)
        // Initialize analyzer
        const analyzer = new KuromojiAnalyzer(
          {
          // Use a reliable public CDN for the dictionary files.
          // Important: Ensure it ends with a slash if the library expects to join filenames.
          // dictPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/"
          dictPath: '/kuromoji/dict/',
        }
        );

        await this.kuroshiro.init(analyzer);
        this.isInitialized = true;
        console.log("Kuroshiro initialized successfully");
      } catch (e) {
        console.error("Failed to initialize Kuroshiro:", e);
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Converts text to Furigana with bracket notation.
   * @param text The Japanese text to convert.
   * @param mode return furigana in ruby tags if mode is 'tags', or in brackets if 'brackets'
   * @returns String with furigana
   */
  async convert(text: string, mode: 'tags' | 'brackets' = 'brackets'): Promise<string> {
    console.log(text);
    if (!text) return "";
    try {
      console.log('1', this.isInitialized);
      await this.init();
      console.log(this.isInitialized);
      if (!this.isInitialized) return text; // Fallback to original text if init failed

      // First convert to HTML ruby tags
      const htmlResult = await this.kuroshiro.convert(text, { to: 'hiragana', mode: 'furigana' });
      console.log(mode);

      // Then convert HTML ruby tags to bracket notation
      if (mode === 'brackets') {
        console.log('before brackets', htmlResult);
        console.log(this.convertHtmlToBrackets(htmlResult));
        return this.convertHtmlToBrackets(htmlResult);
      }
      return htmlResult;
    } catch (e) {
      console.error("Furigana conversion error:", e);
      return text;
    }
  }

  /**
   * Converts HTML ruby tags to bracket notation.
   * @param html The HTML string with ruby tags to convert.
   * @returns String with furigana in bracket notation (e.g. 私[わたし])
   */
  private convertHtmlToBrackets(html: string): string {
    // Regular expression to match ruby tags
    // Matches: <ruby>kanji/fixed text<rp>(</rp><rt>reading</rt><rp>)</rp></ruby>
    // or: <ruby>kanji/fixed text<rt>reading</rt></ruby>
    // We'll preserve spaces and other text around the ruby tags
    const rubyTagRegex = /<ruby>\s*([^<>]*?)\s*(?:<rp>\s*\(\s*<\/?rp\s*>[^<]*<rt>\s*([^<]*)\s*<\/rt>[^<]*<rp>\s*\)\s*<\/?rp\s*>)?\s*<\/ruby>/gi;

    // First, replace ruby tags with bracket notation
    let result = html.replace(rubyTagRegex, (match, kanji, reading) => {
      // If there's a reading, wrap it in brackets after the kanji
      if (reading && reading.trim()) {
        return ` ${kanji}[${reading}]`;
      } else {
        // If no reading, just return the kanji
        return kanji || '';
      }
    });

    // Clean up extra whitespace that might have been introduced
    // Replace multiple spaces with single space and trim
    result = result.trimStart().replace(/\s+/g, ' ').trim();

    return result;
  }
}

export const furiganaService = new FuriganaService();
