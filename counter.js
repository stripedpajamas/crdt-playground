// One of the most basic CRDTs; this Counter is state-based,
// meaning that the entire state is sent to other nodes when
// merging.
class Counter {
  constructor (id) {
    // state holds all the nodes' values, keyed by id
    this.state = []
    this.id = id
  }

  // inc increments this node's value in this node's state
  inc () {
    this.state[this.id] = (this.state[this.id] || 0) + 1
  }

  // value returns the sum of all nodes' values according to this node
  value () {
    return this.state.reduce((acc, el) => acc + el, 0)
  }

  getState () {
    return this.state
  }

  // merge sets this node's state to the maximum value of each
  // node between local state and other state
  merge (otherState) {
    otherState.forEach((node, idx) => {
      if (typeof this.state[idx] === 'undefined') {
        this.state[idx] = node
      } else {
        this.state[idx] = Math.max(this.state[idx], node)
      }
    })
  }
}

const counters = new Array(3).fill(0).map((_, idx) => new Counter(idx))

console.error({ counters })

counters[0].inc() // we are incrementing twice
counters[1].inc() // on two different nodes

// then merging state between 0 and 1, 1 and 0, and 2 and 0.
counters[0].merge(counters[1].getState())
counters[1].merge(counters[0].getState())
counters[2].merge(counters[0].getState())

// in fact, the states don't require "exactly-once" delivery
counters[0].merge(counters[1].getState())
counters[0].merge(counters[1].getState())

console.log(counters.map(counter => counter.value())) // all counters show 2

