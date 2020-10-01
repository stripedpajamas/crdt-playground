// This counter is almost identical to counter.js, but is
// a delta-CRDT. Only deltas are sent to other nodes. 
class Counter {
  constructor (id) {
    // state holds all the nodes' values, keyed by id
    this.state = []
    this.id = id
  }

  // inc increments this node's value in this node's state
  // and returns the delta, which can be applied to other nodes
  inc () {
    this.state[this.id] = (this.state[this.id] || 0) + 1

    const delta = { data: this.state[this.id], id: this.id }
    return delta
  }

  // value returns the sum of all nodes' values according to this node
  value () {
    return this.state.reduce((acc, el) => acc + el, 0)
  }

  // merge applies a state delta from another node to this node's state
  merge (delta) {
    const { data, id } = delta
    this.state[id] = Math.max(data, this.state[id] || 0)
  }
}

const counters = new Array(3).fill(0).map((_, idx) => new Counter(idx))

console.error({ counters })

const delta0 = counters[0].inc() // we are incrementing twice
const delta1 = counters[1].inc() // on two different nodes

// then merging the delta states between nodes
counters[0].merge(delta1)
counters[1].merge(delta0)
counters[2].merge(delta0)
counters[2].merge(delta1)

console.log(counters.map(counter => counter.value())) // all counters show 2

