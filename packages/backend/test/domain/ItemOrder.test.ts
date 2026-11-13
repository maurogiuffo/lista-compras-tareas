import { describe, expect, it } from 'vitest';
import { ItemOrder, ValidationError } from '../../src/domain/index.js';

const order = ['a', 'b', 'c', 'd'];

describe('ItemOrder', () => {
  it('moveToTop sube el ítem al principio', () => {
    expect(ItemOrder.moveToTop(order, 'c')).toEqual(['c', 'a', 'b', 'd']);
  });

  it('moveToBottom baja el ítem al final', () => {
    expect(ItemOrder.moveToBottom(order, 'b')).toEqual(['a', 'c', 'd', 'b']);
  });

  it('moveBefore y moveAfter ubican relativo a otro ítem', () => {
    expect(ItemOrder.moveBefore(order, 'd', 'b')).toEqual(['a', 'd', 'b', 'c']);
    expect(ItemOrder.moveAfter(order, 'a', 'c')).toEqual(['b', 'c', 'a', 'd']);
    expect(ItemOrder.moveAfter(order, 'a', 'd')).toEqual(['b', 'c', 'd', 'a']);
  });

  it('no muta la secuencia original', () => {
    ItemOrder.moveToTop(order, 'd');
    expect(order).toEqual(['a', 'b', 'c', 'd']);
  });

  it('falla con ids desconocidos', () => {
    expect(() => ItemOrder.moveToTop(order, 'z')).toThrow(ValidationError);
    expect(() => ItemOrder.moveBefore(order, 'a', 'z')).toThrow(ValidationError);
  });
});
