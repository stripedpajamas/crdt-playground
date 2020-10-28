class Counter {
  constructor (id) {
    // state holds all the nodes' values, keyed by id
    this.state = {}
    this.id = id
  }

  inc () {
    this.state[this.id] = (this.state[this.id] || 0) + 1

    const delta = { [this.id]: this.state[this.id] }
    return delta
  }

  value () {
    return Object.values(this.state).reduce((acc, el) => acc + el, 0)
  }

  merge (delta) {
    for (const id in delta) {
      const val = delta[id]
      if (typeof this.state[id] === 'undefined') {
        this.state[id] = val
      } else {
        this.state[id] = Math.max(this.state[id], val)
      }
    }
  }
}

class CounterNode {
  constructor () {
    this.id = Math.random().toString(36).slice(2)
    this.crdt = new Counter(this.id)

    this.acks = new Map()
    this.deltas = new Map()
    this.dcounter = 0
    this.dlowerBound = 0

    this.neighbors = new Map()

    this.log = (msg) => console.log(`${this.id}: ${msg}`)
  }

  addNeighbor (id, neighbor) {
    this.neighbors.set(id, neighbor)
  }

  send (to, type, ...data) {
    if (!this.neighbors.has(to)) {
      throw new Error('unable to send to ' + to)
    }
    const dest = this.neighbors.get(to)

    this.log(`sending msg to ${to}`) 
    dest.receive(this.id, type, ...data)
  }

  receive (from, type, ...data) {
    this.log(`received msg type ${type} from ${from}: ${JSON.stringify(data)}`) 

    switch (type) {
      case 'delta': {
        const [delta, n] = data

        this.crdt.merge(delta)
        this.deltas.set(this.dcounter, delta)
        this.dcounter++

        this.send(from, 'ack', n)
        break
      }
      case 'ack': {
        const [n] = data
        this.log(`${from} acknowledges receipt of delta ${n}`)
        this.acks.set(from, Math.max(this.acks.get(from) || 0, n))
        break
      }
      default:
        break
    }
  }

  op (type, ...data) {
    if (typeof this.crdt[type] !== 'function') {
      throw new Error('invalid op')
    }

    this.log(`executing op ${type}`)
    const delta = this.crdt[type](...data)
    this.deltas.set(this.dcounter, delta)
    this.dcounter++
  }

  sync () {
    if (!this.neighbors.size) return
    const possibleDests = [...this.neighbors.keys()]
    const destIdx = Math.floor(Math.random() * possibleDests.length)
    const destId = possibleDests[destIdx]

    const lastAckFromDest = this.acks.get(destId) || 0
    if (lastAckFromDest >= this.dcounter) {
      this.log(`skipping sync with ${destId}; they are up to date`)
      return
    }

    let delta
    if (this.deltas.size === 0 || this.dlowerBound > lastAckFromDest) {
      this.log(`sending full state to ${destId}; they have nothing`)
      delta = this.crdt.state // full state
    } else {
      this.log(`preparing delta group from ${lastAckFromDest} to ${this.dcounter - 1} for ${destId}`)
      for (let i = lastAckFromDest; i < this.dcounter; i++) {
        delta = Object.assign({}, delta, this.deltas.get(i))
      }
    }

    this.send(destId, 'delta', delta, this.dcounter - 1)
  }

  cleanup () {
    const smallestLastAck = Math.min(...this.acks.values())

    if (smallestLastAck > this.dlowerBound) {
      this.log(`deleting deltas between ${this.dlowerBound} and ${smallestLastAck}; they have been ack'd`)

      for (let i = this.dlowerBound; i <= smallestLastAck; i++) {
        this.deltas.delete(i)
      }

      this.dlowerBound = smallestLastAck
    }
  }

  value () {
    return this.crdt.value()
  }
}

module.exports = { CounterNode }
