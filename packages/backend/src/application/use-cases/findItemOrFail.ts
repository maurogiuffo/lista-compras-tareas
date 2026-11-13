import { type Item, type ItemRepository, NotFoundError } from '../../domain/index.js';

export async function findItemOrFail(repository: ItemRepository, id: string): Promise<Item> {
  const item = await repository.findById(id);
  if (!item) throw new NotFoundError(`No existe el ítem ${id}`);
  return item;
}
