class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = [];
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    this.listeners = this.listeners.filter(i => i !== listener);
  }

  getState() {
    return this.state;
  }

  setState(callback) {
    if (this.isSetState) {
      throw new Error('Store is updating');
    }
    try {
      this.isSetState = true;
      const { state } = this;
      this.state = callback(state);
      if (state === this.state) {
        return;
      }
    } finally {
      this.isSetState = false;
    }

    setTimeout(() => {
      const { listeners } = this;

      listeners.forEach(listener => {
        listener();
      });
    }, 0);
  }
}

module.exports = Store;
