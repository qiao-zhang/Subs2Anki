import {beforeEach, describe, expect, it, vi} from 'vitest';

const furiganaMockState = vi.hoisted(() => ({
  init: vi.fn(async () => undefined),
  convert: vi.fn(async () => '<ruby>私<rp>(</rp><rt>わたし</rt><rp>)</rp></ruby>です'),
}));

vi.mock('../../services/kuroshiro-browser', () => ({
  Kuroshiro: class {
    init = furiganaMockState.init;
    convert = furiganaMockState.convert;
  },
  KuroshiroAnalyzerKuromoji: class {},
}));

import {furiganaService} from '../../services/furigana.ts';

const resetService = () => {
  const service = furiganaService as unknown as {
    isInitialized: boolean;
    initPromise: Promise<void> | null;
  };
  service.isInitialized = false;
  service.initPromise = null;
  furiganaMockState.init.mockReset();
  furiganaMockState.convert.mockReset();
  furiganaMockState.init.mockResolvedValue(undefined);
  furiganaMockState.convert.mockResolvedValue('<ruby>私<rp>(</rp><rt>わたし</rt><rp>)</rp></ruby>です');
};

describe('furiganaService', () => {
  beforeEach(() => {
    resetService();
  });

  it('returns empty string immediately for empty input', async () => {
    const result = await furiganaService.convert('');

    expect(result).toBe('');
    expect(furiganaMockState.init).not.toHaveBeenCalled();
    expect(furiganaMockState.convert).not.toHaveBeenCalled();
  });

  it('converts ruby html to bracket notation by default', async () => {
    const result = await furiganaService.convert('私です');

    expect(result).toBe('私[わたし]です');
  });

  it('returns html ruby text in tags mode', async () => {
    const html = '<ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>';
    furiganaMockState.convert.mockResolvedValueOnce(html);

    const result = await furiganaService.convert('漢字', 'tags');

    expect(result).toBe(html);
  });

  it('falls back to original text when initialization fails', async () => {
    furiganaMockState.init.mockRejectedValueOnce(new Error('dict missing'));

    const result = await furiganaService.convert('東京');

    expect(result).toBe('東京');
    expect(furiganaMockState.convert).not.toHaveBeenCalled();
  });
});



