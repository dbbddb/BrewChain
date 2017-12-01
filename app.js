const BrewHTTP = require('./lib/brewHTTP')
const BrewNode = require('./lib/brewNode')

const port = 18070 + Math.floor(Math.random() * 30)
console.log('starting node on ', port)

const httpPort = 3000 + Math.floor(Math.random() * 10)

let httpServer = new BrewHTTP(httpPort, new BrewNode(port))
console.log('created httpServer at port ', httpServer.http_port)
