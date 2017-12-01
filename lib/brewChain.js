const Crypto = require('crypto')
const BrewBlock = require('./brewBlock')

/**
 * BrewChain class: encapsulates and manages a blockchain
 */
class BrewChain {
  constructor () {
    this.chain = []
    this.currentBlock = {}
    this.genesisBlock = new BrewBlock({
      index: 0,
      timestamp: 1511818270000,
      data: 'our genesis data',
      previousHash: '-1',
      nonce: 0
    })
  }

  /**
   * Initializes the first block in the blockchain
   */
  init () {
    this.genesisBlock.hash = this.createHash(this.genesisBlock)
    this.chain.push(this.genesisBlock)
    this.currentBlock = this.genesisBlock
  }

  /**
   * Generates a SHA256 hash based on provided data
   * @param timestamp
   * @param data
   * @param index
   * @param previousHash
   * @param nonce
   * @return {String}
   */
  createHash ({ timestamp, data, index, previousHash, nonce }) {
    return Crypto.createHash('SHA256').update(timestamp + data + index + previousHash + nonce).digest('hex')
  }

  /**
   * Adds a block into the blockchain if it's valid
   * @param block
   * @return {boolean}
   */
  addToChain (block) {
    if (this.checkNewBlockIsValid(block, this.currentBlock)) {
      this.chain.push(block)
      this.currentBlock = block
      return true
    }
    return false
  }

  /**
   * Creates a new block
   * @param data
   * @return {BrewBlock}
   */
  createBlock (data) {
    let newBlock = new BrewBlock({
      timestamp: new Date().getTime(),
      data: data,
      index: this.currentBlock.index + 1,
      previousHash: this.currentBlock.hash,
      nonce: 0
    })
    newBlock = this.proofOfWork(newBlock)
    return newBlock
  }

  /**
   * Proof of workprocess
   * @param block
   * @return {*}
   */
  proofOfWork (block) {
    while (true) {
      block.hash = this.createHash(block)
      if (block.hash.slice(-3) === '000') {
        return block
      } else {
        block.nonce++
      }
    }
  }

  /**
   * Returns the last block inserted into the blockchain
   * @return {*}
   */
  getLatestBlock () {
    return this.currentBlock
  }

  /**
   * Returns the size of the blockchain
   * @return {Number}
   */
  getTotalBlocks () {
    return this.chain.length
  }

  /**
   * Returns the whole blockchain
   * @return {Array<BrewBlock>}
   */
  getChain () {
    return this.chain
  }

  /**
   * Replace the blockchain for a new one
   * @param newChain
   */
  replaceChain (newChain) {
    this.chain = newChain
    this.currentBlock = this.chain[this.chain.length - 1]
  }

  /**
   * Ensures a new block is chained with the previous one
   * @param block
   * @param previousBlock
   * @return {boolean}
   */
  checkNewBlockIsValid (block, previousBlock) {
    if (previousBlock.index + 1 !== block.index) {
      // Invalid index
      return false
    } else if (previousBlock.hash !== block.previousHash) {
      // The previous hash is incorrect
      return false
    } else if (!this.hashIsValid(block)) {
      // The hash isn't correct
      return false
    }

    return true
  }

  /**
   * Check the validity of a block hash
   * @param block
   * @return {boolean}
   */
  hashIsValid (block) {
    return (this.createHash(block) === block.hash)
  }

  /**
   * Check the integrity of a new blockchain
   * @param newChain
   * @return {boolean}
   */
  checkNewChainIsValid (newChain) {
    // Is the first block the genesis block?
    if (this.createHash(newChain[0]) !== this.genesisBlock.hash) {
      return false
    }

    let previousBlock = newChain[0]
    let blockIndex = 1

    while (blockIndex < newChain.length) {
      let block = newChain[blockIndex]

      if (block.previousHash !== this.createHash(previousBlock)) {
        return false
      }

      if (block.hash.slice(-3) !== '000') {
        return false
      }

      previousBlock = block
      blockIndex++
    }

    return true
  }
}

module.exports = BrewChain
