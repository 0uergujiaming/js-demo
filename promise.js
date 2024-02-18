const PENDING = 'pending'
const FULLFILLED = 'fulfilled'
const REJECTED = 'rejected'

function isNative(fn) {
  typeof fn === 'function' && /native code/.test(fn.toString())
}

class MyPromise {
  #state = PENDING
  #result = undefined
  #handlers = []

  constructor(task) {
    const resolve = (data) => {
      this.#changeState(FULLFILLED, data)
    }
    const reject = (error) => {
      this.#changeState(REJECTED, error)
    }

    try {
      task(resolve, reject)
    } catch (error) {
      this.#changeState(FULLFILLED, error)
    }
  }

  #changeState(state, result) {
    if (this.#state !== PENDING) return
    this.#state = state
    this.#result = result
    this.#run()
  }

  #isPromiseLike(value) {
    const { then } = value
    return then instanceof Function
  }

  #runMicroTask(task) {
    // if (typeof Promise !== 'undefined' && isNative(Promise)) {
    //   Promise.resolve().then(task)
    //   return
    // }
    if (typeof MutationObserver !== 'undefined' && (isNative(MutationObserver) || MutationObserver.toString() === '[object MutationObserverConstructor]')) {
      const ob = new MutationObserver(task)
      const p = document.createTextNode('1')
      ob.observe(p, { characterData: true })
      p.data = '2'
      return
    }
    if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
      setImmediate(task)
      return
    }
    setTimeout(task, 0)
  }

  #runOne(callback, resolve, reject) {
    this.#runMicroTask(() => {
      if (typeof callback === 'function') {
        try {
          const data = callback(this.#result)
          if (this.#isPromiseLike(data)) {
            data.then(resolve, reject)
          } else {
            resolve(data)
          }
        } catch (error) {
          reject(error)
        }
      } else {
        const settled = this.#state === FULLFILLED ? resolve : reject
        settled(this.#result)
      }
    })
  }

  #run() {
    if (this.#state === PENDING) return
    while (this.#handlers.length) {
      const { onFulfilled, onRejected, resolve, reject } = this.#handlers.shift()
      if (this.#state === FULLFILLED) {
        this.#runOne(onFulfilled, resolve, reject)
      } else if (this.#state === REJECTED) {
        this.#runOne(onRejected, resolve, reject)
      }
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this.#handlers.push({
        onFulfilled,
        onRejected,
        resolve,
        reject,
      })
      this.#run()
    })
  }
}

const p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(123)
  }, 1000)
})

p.then(
  (res) => {
    console.log('resolve1', res)
    return new MyPromise((resolve,reject) => {
      reject('hhhhhhhhh')
    })
  },
  (err) => {
    console.log('reject1', err)
    return 'asdfghh'
  }
).then((res) => {
  console.log('resolve1-1', res)
},err => {
  console.log('ccccc',err)
})
