const { AVA } = require('../../lib');
const connection = require('../../lib/cli/session/connection');

const dispose = AVA.prototype.dispose;
AVA.prototype.dispose = async function () {
  if (!this.engine) return dispose.call(this);
  await new Promise((resolve) => {
    const release = (message) => {
      if (message !== 'release-cleanup') return;
      process.off('message', release);
      resolve();
    };
    process.on('message', release);
    process.send('cleanup-started');
  });
  await dispose.call(this);
  await new Promise((resolve, reject) => {
    process.send('cleanup-finished', (error) => (error ? reject(error) : resolve()));
  });
};

const handleConnection = connection.handleConnection;
connection.handleConnection = (socket, hooks) =>
  handleConnection(socket, {
    ...hooks,
    dispatch(message, signal) {
      const result = hooks.dispatch(message, signal);
      if (message.command === 'dispose') process.send('dispose-received');
      return result;
    },
  });
