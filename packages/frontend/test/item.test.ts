import { describe, expect, it } from 'vitest';
import { dueState, formatShortDate, moveItem, reorderTarget } from '../src/domain/item';

describe('reorderTarget', () => {
  it('usa el vecino de abajo si existe', () => {
    expect(reorderTarget(['a', 'b', 'c'], 'a')).toEqual({ beforeId: 'b' });
    expect(reorderTarget(['a', 'b', 'c'], 'b')).toEqual({ beforeId: 'c' });
  });

  it('usa el vecino de arriba si quedó último', () => {
    expect(reorderTarget(['a', 'b', 'c'], 'c')).toEqual({ afterId: 'b' });
  });

  it('devuelve null si no hay referencia', () => {
    expect(reorderTarget(['a'], 'a')).toBeNull();
    expect(reorderTarget(['a'], 'z')).toBeNull();
  });
});

describe('moveItem', () => {
  it('mueve sin mutar el original', () => {
    const list = ['a', 'b', 'c'];
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(list, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(list).toEqual(['a', 'b', 'c']);
  });
});

describe('dueState', () => {
  it.each([
    ['2026-03-09', 'overdue'],
    ['2026-03-10', 'today'],
    ['2026-03-13', 'soon'],
    ['2026-03-14', 'later'],
  ])('%s respecto del 2026-03-10 es %s', (date, expected) => {
    expect(dueState(date, '2026-03-10')).toBe(expected);
  });
});

describe('formatShortDate', () => {
  it('formatea como dd/mm/aaaa si no es el año actual', () => {
    expect(formatShortDate('2001-03-10')).toBe('10/03/2001');
  });
});
