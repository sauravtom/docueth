// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
   live: {
     host: "localhost",
   //  host: "localhost",
     port: 12080,
     network_id: 9866
   }
  }
}
