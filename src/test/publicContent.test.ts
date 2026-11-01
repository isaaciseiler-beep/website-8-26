import { describe, expect, it } from 'vitest';
import { publicContent, markdown } from '../../api/public-content';

describe('published project evidence exports', () => {
  const id='congressional-office-setup-100-day-report';
  it('keeps labeled source metrics and their attribution in public records and Markdown', () => {
    const result=publicContent(`content/${id}`);
    expect(result.status).toBe(200);
    const body=(result.data as {body:string}).body;
    expect(body).toContain('constituent cases opened: 550');
    expect(body).toContain('constituent responses: 9,569');
    expect(body).toContain('The numbers belonged to the full team.');
    expect(markdown(`/projects/${id}`)).toContain('constituent cases opened: 550');
  });
  it('finds a project by a published metric while keeping search results concise', () => {
    const result=publicContent('search',new URLSearchParams({q:'550',type:'project'}));
    expect(result.status).toBe(200);
    expect((result.data as {items:{id:string;body?:string}[]}).items).toEqual([expect.objectContaining({id})]);
    expect((result.data as {items:{body?:string}[]}).items[0]).not.toHaveProperty('body');
  });
});
