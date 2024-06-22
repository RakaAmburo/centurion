import { Mutex } from 'async-mutex';

class MessageQueue {

  static queue = [];
  static mutex = new Mutex();

  static async prepareAndEnqueue(severity, message) {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const event = { "id": uniqueId, "severity": severity, "message": message }
    this.#enqueue(event)
  }

  static async  #enqueue(item) {
    const release = await this.mutex.acquire();
    try {
      this.queue.push(item);
      console.log(`Enqueued: ${item}`);
    } finally {
      release();
    }
  }

  static async dequeueAll() {
    const release = await this.mutex.acquire();
    try {
      const dequeuedItems = [];
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        dequeuedItems.push(item);
      }
      return (dequeuedItems.length > 0)?dequeuedItems:this.#getDefaultMessage();
    } finally {
      release();
    }
  }

  static #getDefaultMessage(){
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return [{"id": uniqueId, "severity": 3, "message": "Nothing to report!"}]
  }

  static severity = 3;
}

export default MessageQueue