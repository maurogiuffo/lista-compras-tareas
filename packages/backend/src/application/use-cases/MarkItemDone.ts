import { ItemOrder, type ItemRepository } from '../../domain/index.js';
import { type ItemDto, toItemDto } from '../ItemDto.js';
import type { Clock } from '../ports/Clock.js';
import { findItemOrFail } from './findItemOrFail.js';

/** Marca el ítem como comprado/hecho y lo baja a la última posición. */
export class MarkItemDone {
  constructor(
    private readonly repository: ItemRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string): Promise<ItemDto> {
    const item = await findItemOrFail(this.repository, id);
    const done = item.markDone(this.clock.now());
    await this.repository.save(done);
    await this.repository.saveOrder(ItemOrder.moveToBottom(await this.repository.getOrder(), id));
    return toItemDto(done);
  }
}
