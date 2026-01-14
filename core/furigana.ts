
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

/**
 * Singleton service for Furigana generation.
 * Wraps Kuroshiro and handles lazy initialization of the dictionary.
 */
class FuriganaService {
  private kuroshiro: any;
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
        const analyzer = new KuromojiAnalyzer({
          // Use a reliable public CDN for the dictionary files.
          // Important: Ensure it ends with a slash if the library expects to join filenames.
          dictPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/"
        });

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
   * Converts text to Furigana (HTML Ruby tags).
   * @param text The Japanese text to convert.
   * @returns HTML string with ruby annotations (e.g. <ruby>私<rt>わたし</rt></ruby>)
   */
  async convert(text: string): Promise<string> {
    if (!text) return "";
    try {
      await this.init();
      if (!this.isInitialized) return text; // Fallback to original text if init failed

      // Convert to hiragana with ruby markup
      return await this.kuroshiro.convert(text, { to: 'hiragana', mode: 'furigana' });
    } catch (e) {
      console.error("Furigana conversion error:", e);
      return text;
    }
  }
}

export const furiganaService = new FuriganaService();
