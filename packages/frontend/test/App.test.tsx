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
      category: 'verduleria',
      urgency: 'media',
      dueDate: null,
      notes: null,
    });
    await api.create({
      name: 'Asado',
      category: 'carnes',
      urgency: 'alta',
      dueDate: null,
      notes: null,
    });
    await api.create({
      name: 'Pagar luz',
      category: 'tarea',
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
  });

  it('agrega un ítem al principio', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByRole('button', { name: '+ Agregar' }));
    await user.type(screen.getByPlaceholderText('¿Qué falta?'), 'Leche');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'insumos');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(rowNames()[0]).toBe('Leche'));
    expect(api.items[0]).toMatchObject({ name: 'Leche', category: 'insumos' });
  });

  it('al marcar comprado baja al final y al desmarcar sube al principio', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByLabelText('Marcar Pagar luz como hecho'));
    await waitFor(() => expect(rowNames()).toEqual(['Asado', 'Tomates', 'Pagar luz']));
    await user.click(screen.getByLabelText('Marcar que falta Pagar luz'));
    await waitFor(() => expect(rowNames()).toEqual(['Pagar luz', 'Asado', 'Tomates']));
  });

  it('filtra por categoría', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByRole('button', { name: /Carnes/ }));
    expect(rowNames()).toEqual(['Asado']);
  });

  it('edita un ítem', async () => {
    const user = setup(api);
    await screen.findByText('Asado');
    await user.click(screen.getByLabelText('Editar Asado'));
    const input = screen.getByDisplayValue('Asado');
    await user.clear(input);
    await user.type(input, 'Vacío');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Vacío')).toBeInTheDocument();
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
