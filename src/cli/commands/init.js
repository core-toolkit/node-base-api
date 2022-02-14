module.exports = ({ port }, { addToConfig, addAppToRoot }) => {
  const parsedPort = Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(`Port "${parsedPort}" is invalid, must be a number between 1 and 65535`);
  }
  addToConfig('api:config.js', { port });
  addAppToRoot('Api');
};
