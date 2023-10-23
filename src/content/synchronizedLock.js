class SynchronizedLock {
  constructor() {
    this.lock = false;
    this.queue = [];
  }

  async getLock(timeout = 10000) {
    while (this.lock) {
      await new Promise((resolve) => {
        this.queue.push(resolve);
        setTimeout(() => {
          const index = this.queue.indexOf(resolve);
          if (index !== -1) {
            this.queue.splice(index, 1);
            console.warn('SynchronizedLock timeout');
            resolve();
          }
        }, timeout);
      });
    }

    this.lock = true;
  }

  releaseLock() {
    this.lock = false;
    const resolve = this.queue.shift();
    if (resolve) resolve();
  }
}

const synchronizedLock = new SynchronizedLock();

export default synchronizedLock;
