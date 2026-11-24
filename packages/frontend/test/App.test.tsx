import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { ApiProvider } from '../src/api/ApiContext';
import { FakeItemsApi } from './FakeItemsApi';

function setup(api: FakeItemsApi, confirm = () => true) {
  render(
    <ApiProvider api={api}>
      <App today="2026-03-10" confirm={confirm} />
    </ApiProvider>,
  );
  return userEvent.setup();
}

const rowNames = () =>
  within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.item-name')?.textContent);

describe('App', () => {
  let api: FakeItemsApi;

  beforeEach(async () => {
    api = new FakeItemsApi();
    await api.create({
      name: 'Tomates',
      category: 'insumos',
      subcategory: 'verduleria',
      urgency: 'media',
      dueDate: null,
      notes: null,
    });
    await api.create({
      name: 'Asado',
      category: 'insumos',
      subcategory: 'carniceria',
      urgency: 'alta',
      dueDate: null,
      notes: null,
    });
    await api.create({
      name: 'Pagar luz',
      category: 'tarea',
      subcategory: null,
      urgency: 'media',
      dueDate: '2026-03-09',
      notes: null,
    });
  });

  it('muestra la lista y la cantidad de pendientes', async () => {
    setup(api);
    expect(await screen.findByText('Asado')).toBeInTheDocument();
    expect(rowNames()).toEqual(['Pagar luz', 'Asado', 'Tomates']);
    expect(screen.getByText('3 pendientes')).toBeInTheDocument();
    expect(await screen.findByText('· mauro')).toBeInTheDocument();
  });

  it('agrega un ítem al principio con su subcategoría', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByRole('button', { name: '+ Agregar' }));
    await user.type(screen.getByPlaceholderText('¿Qué falta?'), 'Lavandina');
    await user.selectOptions(screen.getByLabelText('Subcategoría'), 'limpieza');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(rowNames()[0]).toBe('Lavandina'));
    expect(api.items[0]).toMatchObject({
      name: 'Lavandina',
      category: 'insumos',
      subcategory: 'limpieza',
    });
  });

  it('al escribir un ítem nuevo filtra la lista para ver si ya existe', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByRole('button', { name: '+ Agregar' }));
    await user.type(screen.getByPlaceholderText('¿Qué falta?'), 'asa');
    expect(rowNames()).toEqual(['Asado']);
    expect(screen.getByText(/Ya en la lista con “asa”: 1/)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('¿Qué falta?'), 'do');
    expect(screen.getByText('“Asado” ya está en la lista como pendiente.')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('¿Qué falta?'));
    await user.type(screen.getByPlaceholderText('¿Qué falta?'), 'Kiwi');
    expect(screen.getByText(/No está en la lista/)).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(rowNames()).toEqual(['Pagar luz', 'Asado', 'Tomates']);
  });

  it('si lo que escribo ya fue comprado, ofrece marcar que falta', async () => {
    await api.markDone('item-2'); // Asado
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByRole('button', { name: '+ Agregar' }));
    await user.type(screen.getByPlaceholderText('¿Qué falta?'), 'ASADO');
    await user.click(screen.getByRole('button', { name: 'Marcar que falta' }));
    await waitFor(() => expect(api.items[0]).toMatchObject({ name: 'Asado', status: 'pending' }));
  });

  it('las tareas no tienen subcategoría', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByRole('button', { name: '+ Agregar' }));
    await user.selectOptions(screen.getByLabelText('Subcategoría'), 'limpieza');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'tarea');
    expect(screen.queryByLabelText('Subcategoría')).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('¿Qué falta?'), 'Llamar al plomero');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(rowNames()[0]).toBe('Llamar al plomero'));
    expect(api.items[0]).toMatchObject({ category: 'tarea', subcategory: null });
  });

  it('al marcar comprado baja al final y al desmarcar sube al principio', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByLabelText('Marcar Pagar luz como hecho'));
    await waitFor(() => expect(rowNames()).toEqual(['Asado', 'Tomates', 'Pagar luz']));
    await user.click(screen.getByLabelText('Marcar que falta Pagar luz'));
    await waitFor(() => expect(rowNames()).toEqual(['Pagar luz', 'Asado', 'Tomates']));
  });

  it('filtra por categoría y subcategoría', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByRole('button', { name: /Tareas/ }));
    expect(rowNames()).toEqual(['Pagar luz']);
    expect(screen.queryByRole('button', { name: /Carnicería/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Insumos/ }));
    expect(rowNames()).toEqual(['Asado', 'Tomates']);
    await user.click(screen.getByRole('button', { name: /Carnicería/ }));
    expect(rowNames()).toEqual(['Asado']);
    // Volver a tocar la subcategoría activa vuelve a todos los insumos.
    await user.click(screen.getByRole('button', { name: /Carnicería/ }));
    expect(rowNames()).toEqual(['Asado', 'Tomates']);
  });

  it('edita un ítem', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByLabelText('Editar Asado'));
    const input = screen.getByDisplayValue('Asado');
    await user.clear(input);
    await user.type(input, 'Vacío');
    await user.selectOptions(screen.getByLabelText('Urgencia'), 'baja');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Vacío')).toBeInTheDocument();
    expect(api.items.find((i) => i.id === 'item-2')).toMatchObject({
      name: 'Vacío',
      urgency: 'baja',
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('si no se puede guardar la edición, el formulario queda abierto con el aviso', async () => {
    api.update = async () => {
      throw new Error('Sin conexión');
    };
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByLabelText('Editar Asado'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('borra un ítem solo si se confirma', async () => {
    let answer = false;
    const user = setup(api, () => answer);
    await screen.findByText('Asado');
    await user.click(screen.getByLabelText('Borrar Asado'));
    expect(screen.getByText('Asado')).toBeInTheDocument();
    answer = true;
    await user.click(screen.getByLabelText('Borrar Asado'));
    await waitFor(() => expect(screen.queryByText('Asado')).not.toBeInTheDocument());
  });

  it('marca las tareas vencidas', async () => {
    setup(api);
    expect(await screen.findByText(/09\/03/)).toHaveClass('due-overdue');
  });

  it('muestra un aviso si la API falla', async () => {
    api.list = async () => {
      throw new Error('Sin conexión');
    };
    setup(api);
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  });
});
