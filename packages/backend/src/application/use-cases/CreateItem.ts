import { type CreateItemInput, Item, type ItemRepository } from '../../domain/index.js';
import { type ItemDto, toItemDto } from '../ItemDto.js';
import type { Clock } from '../ports/Clock.js';
import type { IdGenerator } from '../ports/IdGenerator.js';

/** Crea un ítem pendiente y lo ubica al principio de la lista. */
export class CreateItem {
  constructor(
    private readonly repository: ItemRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateItemInput): Promise<ItemDto> {
    const item = Item.create(this.ids.next(), input, this.clock.now());
    await this.repository.save(item);
    return toItemDto(item);
  }
}
