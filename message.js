
const db = require('./db')

async function forward_message(client, message, representative_id) {
  let all_user = await db.get_user(representative_id)
  let ids = up_to_100_ids(all_user)
  for (let i = 0; i < ids.length; i++) {
    let params = ids[i].map(({ conversation_id, user_id }) => get_message_params(client, message, conversation_id, user_id, representative_id))
    await client._request.post('/messages', params)
  }
  return true
}

function get_message_params(client, message, conversation_id, recipient_id, representative_id) {
  let { category, data } = message
  let message_id = client.getUUID()
  if (category === 'PLAIN_TEXT') data = Buffer.from(data.toString()).toString('base64')
  return { conversation_id, recipient_id, message_id, category, data, representative_id }
}

function up_to_100_ids(array) {
  let index = 0;
  let newArray = [];
  while (index < array.length) {
    newArray.push(array.slice(index, index += 100));
  }
  return newArray;
}

module.exports = forward_message
