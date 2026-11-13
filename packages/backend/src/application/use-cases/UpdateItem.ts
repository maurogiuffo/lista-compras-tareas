import type { ItemRepository, UpdateItemInput } from '../../domain/index.js';
import { type ItemDto, toItemDto } from '../ItemDto.js';
import type { Clock } from '../ports/Clock.js';
import { findItemOrFail } from './findItemOrFail.js';

export class UpdateItem {
  constructor(
    private readonly repository: ItemRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, input: UpdateItemInput): Promise<ItemDto> {
    const item = await findItemOrFail(this.repository, id);
    const updated = item.update(input, this.clock.now());
    await this.repository.save(updated);
    return toItemDto(updated);
  }
}
