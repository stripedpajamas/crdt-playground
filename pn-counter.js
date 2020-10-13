// One of the most basic CRDTs; this Counter is state-based,
// meaning that the entire state is sent to other nodes when
// merging. It maintains two internal states: one for increments
// and one for decrements.
class PNCounter {
  constructor (id) {
    // state holds all the nodes' values, keyed by id
    this.positiveState = []
    this.negativeState = []
    this.id = id
  }

  // inc increments this node's value in this node's state
  inc () {
    this.positiveState[this.id] = (this.positiveState[this.id] || 0) + 1
  }

  dec () {
    this.negativeState[this.id] = (this.negativeState[this.id] || 0) + 1
  }

  // value sums positive state and negative state and takes the difference
  value () {
    const pos = this.positiveState.reduce((acc, el) => acc + el, 0)
    const neg = this.negativeState.reduce((acc, el) => acc + el, 0)
    return pos - neg
  }

  getState () {
    return { positiveState: this.positiveState, negativeState: this.negativeState }
  }

  // merge sets this node's state to the maximum value of each
  // node between local state and other state
  merge ({ positiveState, negativeState }) {
    positiveState.forEach((node, idx) => {
      if (typeof this.positiveState[idx] === 'undefined') {
        this.positiveState[idx] = node
      } else {
        this.positiveState[idx] = Math.max(this.positiveState[idx], node)
      }
    })
    negativeState.forEach((node, idx) => {
      if (typeof this.negativeState[idx] === 'undefined') {
        this.negativeState[idx] = node
      } else {
        this.negativeState[idx] = Math.max(this.negativeState[idx], node)
      }
    })
  }
}

const counters = new Array(3).fill(0).map((_, idx) => new PNCounter(idx))

console.error({ counters })

counters[0].inc() // we are incrementing thrice
counters[1].inc() // on three different nodes
counters[2].inc()

counters[1].dec() // and decrementing twice
counters[2].dec() // on two different nodes

// then merging state between all the nodes
counters[0].merge(counters[1].getState())
counters[1].merge(counters[0].getState())
counters[0].merge(counters[2].getState())
counters[2].merge(counters[0].getState())
counters[1].merge(counters[2].getState())
counters[2].merge(counters[1].getState())

// in fact, the states don't require "exactly-once" delivery
counters[0].merge(counters[1].getState())
counters[0].merge(counters[1].getState())

console.log(counters.map(counter => counter.value())) // all counters show (3 - 2 = 1)

