import { describe, expect, it } from 'vitest';
import { sentenceCaseHeading } from '@/lib/sentenceHeading';

describe('sentenceCaseHeading', () => {
  it('lowers title-case section headings and keeps names', () => {
    expect(sentenceCaseHeading('From the Idea to the Lab')).toBe('From the idea to the lab');
    expect(sentenceCaseHeading('What I Built')).toBe('What I built');
    expect(sentenceCaseHeading('AI literacy in Taiwan')).toBe('AI literacy in Taiwan');
    expect(sentenceCaseHeading('Study Mode: making ChatGPT teach, not answer')).toBe('Study mode: making ChatGPT teach, not answer');
    expect(sentenceCaseHeading('Making the first 100 days measurable')).toBe('Making the first 100 days measurable');
    expect(sentenceCaseHeading('Turning a West Michigan story into national news')).toBe('Turning a West Michigan story into national news');
    expect(sentenceCaseHeading('The State of the Union')).toBe('The State of the Union');
    expect(sentenceCaseHeading('100 Chats: turning behavior into a book')).toBe('100 Chats: turning behavior into a book');
  });
});
