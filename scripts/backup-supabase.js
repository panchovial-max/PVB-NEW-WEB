#!/usr/bin/env node
// Backup de datos Supabase a archivos JSON locales (sin dependencias externas)
// Uso: node scripts/backup-supabase.js

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://krmoihryyvooymvhsuno.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybW9paHJ5eXZvb3ltdmhzdW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg3Mzk2NiwiZXhwIjoyMDg0NDQ5OTY2fQ.85-Ku_nWMNZCVIOc7Qbx4keOABKsiourGCSS5WF15zA';

const TABLES = ['user_profiles', 'social_accounts', 'social_metrics', 'client_contexts'];

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const backupDir = join(process.cwd(), `backups/supabase-${timestamp}`);
mkdirSync(backupDir, { recursive: true });

async function fetchTable(table) {
  let allRows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${res.status}: ${err}`);
    }

    const rows = await res.json();
    allRows = allRows.concat(rows);
    if (rows.length < limit) break;
    offset += limit;
  }

  return allRows;
}

let totalRows = 0;

for (const table of TABLES) {
  process.stdout.write(`Exportando ${table}... `);
  try {
    const rows = await fetchTable(table);
    const filePath = join(backupDir, `${table}.json`);
    writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf-8');
    console.log(`${rows.length} filas -> ${table}.json`);
    totalRows += rows.length;
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  }
}

const summary = {
  timestamp: new Date().toISOString(),
  tables: TABLES,
  backup_dir: backupDir,
  total_rows: totalRows
};
writeFileSync(join(backupDir, '_summary.json'), JSON.stringify(summary, null, 2));

console.log(`\nBackup completo: ${backupDir}`);
console.log(`Total: ${totalRows} filas en ${TABLES.length} tablas`);
