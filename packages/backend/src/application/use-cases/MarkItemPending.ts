import { ItemOrder, type ItemRepository } from '../../domain/index.js';
import { type ItemDto, toItemDto } from '../ItemDto.js';
import type { Clock } from '../ports/Clock.js';
import { findItemOrFail } from './findItemOrFail.js';

/** Marca el ítem como "falta" y lo sube al principio de la lista. */
export class MarkItemPending {
  constructor(
    private readonly repository: ItemRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string): Promise<ItemDto> {
    const item = await findItemOrFail(this.repository, id);
    const pending = item.markPending(this.clock.now());
    await this.repository.save(pending);
    await this.repository.saveOrder(ItemOrder.moveToTop(await this.repository.getOrder(), id));
    return toItemDto(pending);
  }
}
