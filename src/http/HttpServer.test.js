const HttpServer = require('./HttpServer');
const { deepMockClear } = require('../../../node-base/src/utils/Mock');

const context = {
  Controller: 'foo',
  Core: { Config: { api: { port: 'bar' } } },
  Service: {},
  Log: new Proxy(jest.fn(), { get: (mock) => mock }),
  close: jest.fn(),
  listen: jest.fn(),
  use: jest.fn(() => context),
  express: jest.fn(() => context),
  router: jest.fn(() => 'baz'),
  middleware: jest.fn(() => 'qux'),
};

describe('HttpServer', () => {
  beforeEach(() => deepMockClear(context));

  it('makes an HTTP server', () => {
    const makeServer = HttpServer(context.express, context.router, context.middleware);
    expect(makeServer).toBeInstanceOf(Function);

    const server = makeServer(context);
    expect(server).toBeInstanceOf(Object);
    expect(server).toHaveProperty('applyRoutes', expect.any(Function));
    expect(server).toHaveProperty('start', expect.any(Function));
    expect(server).toHaveProperty('stop', expect.any(Function));
    expect(context.router).toHaveBeenCalledWith(context.express, 'qux');
    expect(context.middleware).toHaveBeenCalledWith(context.Log);
    expect(context.express).toHaveBeenCalled();
    expect(context.use).toHaveBeenCalledWith('baz');
  });

  describe('.applyRoutes', () => {
    it('applies the supplied routes ', () => {
      const server = HttpServer(context.express, context.router, context.middleware)(context);
      const mock = jest.fn();

      server.applyRoutes(mock);
      expect(mock).toHaveBeenCalledWith('baz', context.Controller);
    });
  });

  describe('.start', () => {
    it('starts the server', () => {
      const server = HttpServer(context.express, context.router, context.middleware)(context);
      expect(context.listen).not.toHaveBeenCalled();

      server.start();
      expect(context.listen).toHaveBeenCalledWith('bar', expect.any(Function));
    });
  });

  describe('.stop', () => {
    it('stops the server', async () => {
      const server = HttpServer(context.express, context.router, context.middleware)(context);
      server.start();
      expect(context.close).not.toHaveBeenCalled();

      await server.stop();
      expect(context.close).toHaveBeenCalled();
    });
  });
});
