const db = require('../src/database/db');

async function auditDatabase() {
  console.log('====================================================');
  console.log('  Database Schema & Index Audit');
  console.log('====================================================');

  try {
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map((r) => r.table_name);
    console.log(`Discovered ${tableNames.length} tables in PostgreSQL:`, tableNames);

    for (const t of tableNames) {
      console.log(`\n--- TABLE: ${t} ---`);

      // Columns
      const colsRes = await db.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1 
         ORDER BY ordinal_position;`,
        [t]
      );
      console.log('Columns:');
      colsRes.rows.forEach((c) => {
        console.log(`  - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable}, default: ${c.column_default})`);
      });

      // Row count
      const countRes = await db.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
      console.log(`Row count: ${countRes.rows[0].cnt}`);

      // Foreign keys
      const fkRes = await db.query(
        `SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
         FROM information_schema.table_constraints AS tc
         JOIN information_schema.key_column_usage AS kcu
           ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage AS ccu
           ON ccu.constraint_name = tc.constraint_name
           AND ccu.table_schema = tc.table_schema
         WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;`,
        [t]
      );
      if (fkRes.rows.length > 0) {
        console.log('Foreign Keys:');
        fkRes.rows.forEach((fk) => {
          console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
        });
      }
    }

    // Indexes
    console.log('\n====================================================');
    console.log('  Existing Indexes in PostgreSQL');
    console.log('====================================================');
    const idxRes = await db.query(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `);
    idxRes.rows.forEach((idx) => {
      console.log(`[${idx.tablename}] ${idx.indexname} -> ${idx.indexdef}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Audit script error:', err);
    process.exit(1);
  }
}

auditDatabase();
