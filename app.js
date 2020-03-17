
const { CLIENT_CONFIG } = require('./config')
const { MixinSocket } = require('mixin-node-sdk')
const db = require('./db')
const forward_message = require('./message')

const client = new MixinSocket(CLIENT_CONFIG, true)


client.get_message_handler = async function (message) {
  this.read_message(message)
  if (!message.action || message.action === 'ACKNOWLEDGE_MESSAGE_RECEIPT' || message.action === 'LIST_PENDING_MESSAGES' || !message.data || !message.data.data) return;
  if (message.error) return console.log(message.error)
  let { data } = message
  let { conversation_id, user_id } = data
  if (!(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(user_id))) return
  await db.add_user(user_id, conversation_id)
  return await forward_message(client, data, user_id)
}

client.start()