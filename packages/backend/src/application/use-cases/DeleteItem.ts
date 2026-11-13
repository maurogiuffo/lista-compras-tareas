import type { ItemRepository } from '../../domain/index.js';
import { findItemOrFail } from './findItemOrFail.js';

export class DeleteItem {
  constructor(private readonly repository: ItemRepository) {}

  async execute(id: string): Promise<void> {
    await findItemOrFail(this.repository, id);
    await this.repository.delete(id);
  }
}
