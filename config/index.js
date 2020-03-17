
const { DATABASE_CONFIG, CLIENT_CONFIG } = process.env.NODE_ENV === 'production' ? require('./conf.prod') : require('./conf.dev')


module.exports = { DATABASE_CONFIG, CLIENT_CONFIG }
