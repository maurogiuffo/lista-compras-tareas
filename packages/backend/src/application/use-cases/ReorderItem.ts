import { ItemOrder, type ItemRepository, ValidationError } from '../../domain/index.js';

/** Exactamente uno de los dos: el ítem queda antes o después del ítem de referencia. */
export type ReorderItemInput =
  | { readonly beforeId: string; readonly afterId?: undefined }
  | { readonly afterId: string; readonly beforeId?: undefined };

/** Arrastrar y soltar. */
export class ReorderItem {
  constructor(private readonly repository: ItemRepository) {}

  async execute(id: string, input: ReorderItemInput): Promise<string[]> {
    const order = await this.repository.getOrder();
    let next: string[];
    if (input.beforeId !== undefined) {
      next = ItemOrder.moveBefore(order, id, input.beforeId);
    } else if (input.afterId !== undefined) {
      next = ItemOrder.moveAfter(order, id, input.afterId);
    } else {
      throw new ValidationError('Indicá beforeId o afterId');
    }
    await this.repository.saveOrder(next);
    return next;
  }
}
