'use strict'

const { Writable } = require('stream')
const dgram = require('dgram')

class UdpConnection extends Writable {
  constructor (options) {
    options = options || {}
    super(options)

    this.address = options.address || '127.0.0.1'
    this.port = options.port || 514
    this.maxPacketSize = options.maxPacketSize || 1452  // Ajout : taille max sûre pour UDP6 (configurable)

    this.socket = dgram.createSocket('udp6')  // Votre modification pour UDP6

    this.socket.on('error', (err) => {
      this.emit('error', err)
    })
  }

  _write (chunk, enc, cb) {
    if (chunk.length > this.maxPacketSize) {
      console.error(`Dropped large packet: ${chunk.length} > ${this.maxPacketSize}`)
      return cb()  // Ignore le paquet trop grand sans erreur, pour ne pas bloquer le stream
      // Alternative : Tronquer (mais risque de casser le JSON)
      // chunk = Buffer.concat([chunk.slice(0, this.maxPacketSize - 3), Buffer.from('...')])
    }

    this.socket.send(chunk, 0, chunk.length, this.port, this.address, (err) => {
      if (err) {
        this.emit('error', err)
      }
      cb(err)
    })
  }

  _destroy (err, cb) {
    this.socket.close()
    cb(err)
  }
}

module.exports = UdpConnection
