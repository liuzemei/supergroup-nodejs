const DATABASE_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'liuzemei',
  password: 'abcd1234',
  database: 'supergroup_node'
}

const CLIENT_CONFIG = {
  app_number: "7000102578", // 1054912 没有实际使用，只是提醒自己是那个机器人。
  client_id: "454e42f8-xxxx-xxxx-xxxx-05f641b201d4",
  session_id: "3bcf8e4a-xxxx-xxxx-xxxx-c99c6077e2fb",
  private_key: "-----BEGIN RSA PRIVATE KEY-----\r\nMIICXAIBAAKBgQCdnzwFLcqQHxxxx6SNFkuDxxxxwy29KDdfGQSZMjwS9BjlS1+A\r\ndCHmYs4RkiKl1xxxx3JcdHioC63sQgnGO117EZtexBTexxxx0Lf+B7W0n09Cw4sG\r\nuosR6dL0bbLSfgZNdfxxxxVCfZU8+jWRxxxxxxx............xxxxxxxfDs=\r\n-----END RSA PRIVATE KEY-----\r\n"
}


module.exports = { DATABASE_CONFIG, CLIENT_CONFIG }
