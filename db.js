const pgsql = require('pg')
const { DATABASE_CONFIG } = require('./config')


async function query(sql, params) {
  const client = new pgsql.Client(DATABASE_CONFIG)
  await client.connect()
  const { rows } = await client.query(sql, params)
  await client.end()
  return rows
}

class DB {
  async add_user(user_id, conversation_id) {
    let sql = 'INSERT INTO users(user_id, conversation_id) VALUES($1::varchar, $2::varchar) ON CONFLICT(user_id) DO NOTHING'
    return await query(sql, [user_id, conversation_id])
  }
  async get_user(user_id) {
    let sql = 'SELECT * FROM users WHERE user_id!=$1'
    return await query(sql, [user_id])
  }
}

module.exports = new DB()