
const { CLIENT_CONFIG } = require('./config')
const { MixinSocket } = require('mixin-node-sdk')
const db = require('./db')
const forward_message = require('./message')

const client = new MixinSocket(CLIENT_CONFIG)


client.get_message_handler = async function (message) {
  if (!message.action || message.action === 'ACKNOWLEDGE_MESSAGE_RECEIPT' || message.action === 'LIST_PENDING_MESSAGES' || !message.data || !message.data.data) return;
  if (message.error) return console.log(message.error)
  await this.read_message(message)
  let { data } = message
  let { conversation_id, user_id } = data
  await db.add_user(user_id, conversation_id)
  return await forward_message(client, data, user_id)
}

client.start()