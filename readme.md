> 项目中不涉及前端代码，仅供学习参考使用。关于API的使用，详情请参见文档：[Mixin API](https://developers.mixin.one/api)，或者部分 [中文文档](http://mixindocument.liuzemei.com)

读完此篇文章，您将获得
> 1. Nodejs 极简版的大群实现。

技术栈
> [NodeJs](http://nodejs.cn/api/)
> [PostgreSQL](http://www.postgres.cn/docs/11/)

或者换成任何你擅长的 SQL 都行。

相关代码参见
>  [https://github.com/liuzemei/supergroup-nodejs](https://github.com/liuzemei/supergroup-nodejs)

> Demo 可以添加 机器人 `7000102578` 已经在线运行。

以下进入正文。
### 1. 实现逻辑解读
1. 利用 websocket 接收用户对机器人发送的消息。
2. 收到消息后，转发给其他关注群的所有用户。

> 由于现在转发消息的认证权限还没有启用，也就是说，用户入群之后，可以直接转发消息，后续肯定会启用权限认证，届时，就需要用户先授权机器人可以转发消息，才可以正常转发自己的消息。

### 2. 使用
#### 1. 注册一个 Mixin 机器人
[详情参见](https://w3c.group/c/1583725902875269)

#### 2. 运行 Demo
###### 1. 拉下代码 并 进入项目目录
```
git clone https://github.com/liuzemei/supergroup-nodejs.git
cd supergroup-nodejs
```

###### 2. 新建数据库
> 根据 `schema.sql` 文件，建立一个用户表。

###### 3. 更换 `config.js` 的信息
```
const DATABASE_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'liuzemei',
  password: 'abcd1234',
  database: 'supergroup_node'
}

const CLIENT_CONFIG = {
  client_id: "454e42f8-xxxx-xxxx-xxxx-05f641b201d4",
  session_id: "3bcf8e4a-xxxx-xxxx-xxxx-c99c6077e2fb",
  private_key: "-----BEGIN RSA PRIVATE KEY-----\r\nMIICXAIBAAKBgQCdnzwFLcqQHxxxx6SNFkuDxxxxwy29KDdfGQSZMjwS9BjlS1+A\r\ndCHmYs4RkiKl1xxxx3JcdHioC63sQgnGO117EZtexBTexxxx0Lf+B7W0n09Cw4sG\r\nuosR6dL0bbLSfgZNdfxxxxVCfZU8+jWRxxxxxxx............xxxxxxxfDs=\r\n-----END RSA PRIVATE KEY-----\r\n"
}

module.exports = { DATABASE_CONFIG, CLIENT_CONFIG }
```
> 主要更换：
> 1. 数据库：用户名，密码，库名。
> 2. 机器人：`client_id`，`session_id`，`private_key`。
> 注意，这里只实现消息转发，如果需要转账操作，需要 `pin` 及 `pin_token`

###### 4. 启动程序。
确认好，`数据库创建`，`config.js信息`完毕。
```cmd
npm install
node app.js
```
正常的话，到这里不会有任何的提示，如果有提示可能是报错信息。可以回头看看是否完成配置。
> 如果没有任何提示出现的话，可以用两个 Mixin Messenger 客户端，同时添加机器人为好友，就可以相互发消息了。

### 3. 核心代码解析
整个项目加上空行也不到100行代码，所以实现起来也并不复杂。
#### 1. `db.js`
```js
const pgsql = require('pg')
const { DATABASE_CONFIG } = require('./config')


async function tx(sql, params) {
  const client = new pgsql.Client(DATABASE_CONFIG)
  await client.connect()
  const { rows } = await client.query(sql, params)
  await client.end()
  return rows
}

class DB {
  async add_user(user_id, conversation_id) {
    let sql = 'INSERT INTO users(user_id, conversation_id) VALUES($1::varchar, $2::varchar) ON CONFLICT(user_id) DO NOTHING'
    return await tx(sql, [user_id, conversation_id])
  }
  async get_user(user_id) {
    let sql = 'SELECT * FROM users WHERE user_id!=$1'
    return await tx(sql, [user_id])
  }
}

module.exports = new DB()
```
1. `tx`：就是封装了句柄，可以使用 sql 进行查询。
2. `add_user`：顾名思义，就是添加一个用户，这里只需要他的user_id（用户ID） 和 conversation_id（会话ID）就可以定位到一个会话。（ps：理论上只要 conversation_id 就可以定位到会话，不过想批量发消息的话，还得指定 user_id）
3. `get_user`：这里要实现的是转发消息，那肯定是不包含发消息者的其他所有人。

#### 2. `message.js`
```js
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
```
1. `up_to_100_ids`：
功能：将一个数组分割为最大长度为 100 的多个数组。（因为通过API转发消息上限是 100 条）

2. `get_message_params`
功能：返回一个符合 `post /messages` 格式的消息。
参数：

|名称|格式|说明|
| - | - | - |
| client | MixinSocket(object) | MixinSocket 对象 |
| message | object | 消息对象 |
| conversation_id | string(uuid) | 接收者会话ID |
| recipient_id | string(uuid) | 接收者用户ID |
| representative_id | string(uuid) | 发送人ID |

3. `forward_message`：
功能：消息转发的入口，通过调用这个函数，可以完成消息对其他用户的转发。
参数：上个函数中均有讲解。
逻辑：其实也很简单，首先拿到所有要转发的用户，然后构造 `post /messages` 的参数，然后分批转发就行了。

#### 3. `app.js`
```js
const { CLIENT_CONFIG } = require('./config')
const { MixinSocket } = require('mixin-node-sdk')
const db = require('./db')
const forward_message = require('./message')
const client = new MixinSocket(CLIENT_CONFIG, true)

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
```
1. 首先通过配置的机器人参数，实例化一个 MixinSocket 的对象。
2. 拿到消息之后，先尝试把用户添加到数据库，如果已经存在了的话，就 `DO NOTING`，这个逻辑写在 `SQL 语句`里了。
3. 直接调用 `forward_message` 进行消息转发。

至此，整个大群已经成功完成。
> 注意，由于是极简版的大群，所以还不支持消息撤回和消息引用。因为那得建立转发消息和原始消息之间的关系，稍微复杂一点，有兴趣的同学可以自己实现一下。

这里提供一点思路：
> 1. 消息引用 需要在 `post /messages` 的参数里加入 `quote_message_id` ，而这个 `quote_message_id` 就是每个用户单独生成的 uuid ，转发的时候，需要存起来。保证每个用户引用同一条消息。
> 2. 撤回消息 逻辑跟消息引用差不多，都是需要把转发的消息存起来并建立好关系，撤回的时候，利用对应关系和转发的 message_id 再发一条撤回的消息就行。

>最后：再把git地址列出来。详细代码参见：
[https://github.com/liuzemei/supergroup-nodejs](https://github.com/liuzemei/supergroup-nodejs)

如有问题，也欢迎在Mixin Messenger上直接联系我。

![在 Mixin 中扫码添加](https://upload-images.jianshu.io/upload_images/6960775-3e55ee6cf4c11ab6.png?imageMogr2/auto-orient/strip|imageView2/2/w/570/format/webp) 