class Counter {
  constructor (id) {
    this.state = []
    this.id = id
  }

  inc () {
    this.state[this.id] = (this.state[this.id] || 0) + 1
  }

  value () {
    return this.state.reduce((acc, el) => acc + el, 0)
  }

  getState () {
    return this.state
  }

  merge (otherState) {
    otherState.forEach((node, idx) => {
      if (typeof this.state[idx] === 'undefined') {
        this.state[idx] = node
      } else {
        this.state[idx] = Math.max(this.state[idx], node)
      }
    })
    this.state.forEach((node, idx) => {
      if (typeof otherState[idx] !== 'undefined') {
        this.state[idx] = Math.max(otherState[idx], node)
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

console.log(counters.map(counter => counter.value())) // all counters show 2

