#!/usr/bin/env node
/**
 * Carga ítems iniciales a través de la API (no toca la base directamente, así respeta
 * todas las reglas del dominio). Es idempotente: saltea los nombres que ya existen.
 *
 * Uso:
 *   node scripts/seed.mjs [archivo.json]
 *   API_URL=http://localhost:8080/api node scripts/seed.mjs   # contra Docker
 *
 * Por defecto usa http://localhost:3000/api y scripts/data/compras.json.
 * Los ítems quedan en el mismo orden que en el archivo (el primero arriba).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const [major] = process.versions.node.split('.').map(Number);
if (major < 22) {
  console.error(`Este proyecto necesita Node 22 o superior (tenés ${process.version}).`);
  process.exit(1);
}

const apiUrl = (process.env.API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');
const file = process.argv[2] ?? fileURLToPath(new URL('./data/compras.json', import.meta.url));

async function request(method, path, body) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

const normalize = (name) =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

const items = JSON.parse(await readFile(file, 'utf8'));
const existing = new Set((await request('GET', '/items')).map((i) => normalize(i.name)));

// Cada ítem nuevo entra arriba: se cargan al revés para conservar el orden del archivo.
let created = 0;
for (const item of [...items].reverse()) {
  if (existing.has(normalize(item.name))) continue;
  await request('POST', '/items', item);
  created += 1;
}

console.log(
  `Cargados ${created} ítems nuevos (${items.length - created} ya existían) en ${apiUrl}`,
);
