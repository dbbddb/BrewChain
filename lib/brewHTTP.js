const Express = require('express')
const BodyParser = require('body-parser')

/**
 * Class BrewHTTP: creates the route management web server with express
 */
class BrewHTTP {
  /**
   * Creates an instance of a listening server
   * @param port
   * @param node1
   */
  constructor (port, node1) {
    this.http_port = port
    this.firstNode = node1
    this.app = new Express()

    this.app.use(BodyParser.json())
    this.firstNode.init()
    this.app.get('/addNode/:port', (req, res) => {
      console.log('add host: ' + req.params.port)
      node1.addPeer('localhost', req.params.port)
      res.send()
    })

    this.app.get('/spawnBrew/:teammember', (req, res) => {
      node1.createBlock(req.params.teammember)
      console.log('block created')
      res.send()
    })

    this.app.listen(this.http_port, () => {
      console.log('http server up')
    })
  }
}
module.exports = BrewHTTP
