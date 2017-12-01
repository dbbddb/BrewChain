const BrewChain = require('./brewChain')
const WebSocket = require('ws')

/**
 * Class BrewNode: this class manages the nodes: connectivity and decentralized tasks using websockets
 */
class BrewNode {
  /**
   * Creates an instance of BrewNode
   * @param port
   */
  constructor (port) {
    this.brewSockets = []
    this.brewServer = ''
    this._port = port
    this.chain = new BrewChain()
    this.REQUEST_CHAIN = 'REQUEST_CHAIN'
    this.REQUEST_BLOCK = 'REQUEST_BLOCK'
    this.BLOCK = 'BLOCK'
    this.CHAIN = 'CHAIN'
  }

  /**
   * Initializes the server
   */
  init () {
    this.chain.init()
    this.brewServer = new WebSocket.Server({ port: this._port })
    this.brewServer.on('connection', (connection) => {
      console.log('connection in')
      this.initConnection(connection)
    })
  }

  /**
   * Manages the incoming messages
   * @param connection
   */
  messageHandler (connection) {
    connection.on('message', (data) => {
      const msg = JSON.parse(data)
      switch (msg.event) {
        case this.REQUEST_CHAIN:
          connection.send(JSON.stringify({ event: this.CHAIN, message: this.chain.getChain() }))
          break
        case this.REQUEST_BLOCK:
          this.requestLatestBlock(connection)
          break
        case this.BLOCK:
          this.processedRecievedBlock(msg.message)
          break
        case this.CHAIN:
          this.processedRecievedChain(msg.message)
          break

        default:
          console.log('Unknown message ')
      }
    })
  }

  /**
   * Receives a new blockchain
   * @param blocks
   */
  processedRecievedChain (blocks) {
    let newChain = blocks.sort((block1, block2) => (block1.index - block2.index))
    if (newChain.length > this.chain.getTotalBlocks() && this.chain.checkNewChainIsValid(newChain)) {
      this.chain.replaceChain(newChain)
      console.log('chain replaced')
    }
  }

  /**
   * Receives a new single block
   * @param block
   */
  processedRecievedBlock (block) {
    let currentTopBlock = this.chain.getLatestBlock()

    // Is the same or older?
    if (block.index <= currentTopBlock.index) {
      console.log('No update needed')
      return
    }

    // Is claiming to be the next in the chain
    if (block.previousHash === currentTopBlock.hash) {
      // Attempt the top block to our chain
      this.chain.addToChain(block)

      console.log('New block added')
      console.log(this.chain.getLatestBlock())
    } else {
      // It is ahead.. we are therefore a few behind, request the whole chain
      console.log('requesting chain')
      this.broadcastMessage(this.REQUEST_CHAIN, '')
    }
  }

  /**
   * Requests the latest block inserted in the blockchain
   * @param connection
   */
  requestLatestBlock (connection) {
    connection.send(JSON.stringify({ event: this.BLOCK, message: this.chain.getLatestBlock() }))
  }

  /**
   * Sends a broadcast message (to all sockets)
   * @param event
   * @param message
   */
  broadcastMessage (event, message) {
    this.brewSockets.forEach(node => node.send(JSON.stringify({ event, message })))
  }

  /**
   * Deletes the websocket
   * @param connection
   */
  closeConnection (connection) {
    console.log('closing connection')
    this.brewSockets.splice(this.brewSockets.indexOf(connection), 1)
  }

  /**
   * Initializes the connection configuration
   * @param connection
   */
  initConnection (connection) {
    console.log('init connection')

    this.messageHandler(connection)

    this.requestLatestBlock(connection)

    this.brewSockets.push(connection)

    connection.on('error', () => this.closeConnection(connection))
    connection.on('close', () => this.closeConnection(connection))
  }

  /**
   * Creates a new block and notifies to all nodes
   * @param teammember
   */
  createBlock (teammember) {
    let newBlock = this.chain.createBlock(teammember)
    this.chain.addToChain(newBlock)
    this.broadcastMessage(this.BLOCK, newBlock)
  }

  /**
   * Obtains the number of total blocks in the blockchain
   * @return {{blocks: Number}}
   */
  getStats () {
    return {
      blocks: this.chain.getTotalBlocks()
    }
  }

  /**
   * Adds a peer to the socket pool
   * @param host
   * @param port
   */
  addPeer (host, port) {
    let connection = new WebSocket(`ws://${host}:${port}`)

    connection.on('error', (error) => {
      console.log(error)
    })

    connection.on('open', (msg) => {
      this.initConnection(connection)
    })
  }
}

module.exports = BrewNode
