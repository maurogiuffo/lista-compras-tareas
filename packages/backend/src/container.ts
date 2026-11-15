import {
  type Clock,
  CreateItem,
  DeleteItem,
  type IdGenerator,
  ListItems,
  MarkItemDone,
  MarkItemPending,
  ReorderItem,
  UpdateItem,
  systemClock,
  uuidGenerator,
} from './application/index.js';
import type { ItemRepository, ItemRepositoryProvider, OwnerId } from './domain/index.js';

export interface UseCases {
  readonly listItems: ListItems;
  readonly createItem: CreateItem;
  readonly updateItem: UpdateItem;
  readonly deleteItem: DeleteItem;
  readonly markItemDone: MarkItemDone;
  readonly markItemPending: MarkItemPending;
  readonly reorderItem: ReorderItem;
}

export interface ContainerDeps {
  readonly repository: ItemRepository;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
}

/** Composition root: el único lugar donde se conectan las implementaciones concretas. */
export function createUseCases({
  repository,
  clock = systemClock,
  ids = uuidGenerator,
}: ContainerDeps): UseCases {
  return {
    listItems: new ListItems(repository),
    createItem: new CreateItem(repository, ids, clock),
    updateItem: new UpdateItem(repository, clock),
    deleteItem: new DeleteItem(repository),
    markItemDone: new MarkItemDone(repository, clock),
    markItemPending: new MarkItemPending(repository, clock),
    reorderItem: new ReorderItem(repository),
  };
}

/** Arma los casos de uso de la lista de un usuario. Son objetos livianos: uno por request. */
export type UseCasesFactory = (ownerId: OwnerId) => UseCases;

export function createUseCasesFactory(
  provider: ItemRepositoryProvider,
  deps: Omit<ContainerDeps, 'repository'> = {},
): UseCasesFactory {
  return (ownerId) => createUseCases({ ...deps, repository: provider.forOwner(ownerId) });
}
