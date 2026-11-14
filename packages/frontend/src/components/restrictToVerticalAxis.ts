import type { Modifier } from '@dnd-kit/core';

/** Limita el arrastre al eje vertical (evita depender de @dnd-kit/modifiers). */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
