const { Pool } = require('pg');


const sql = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'volunteer_scheduler_db',
  password: 'Vanguard7861',
  port: 5432,
});


module.exports = sql;