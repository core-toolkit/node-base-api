const HttpServer = require('./HttpServer');
const { deepMockClear } = require('@core-toolkit/node-base/src/utils/Mock');

const httpServer = {
  listen: jest.fn((_, fn) => fn()),
  close: jest.fn(),
};

const http = { createServer: jest.fn(() => httpServer) };
const router = { use: jest.fn(() => router) };
const Router = jest.fn(() => router);
const express = jest.fn(() => router);
const ApiMiddleware = jest.fn(() => 'qux');

const context = {
  Controller: 'foo',
  Core: { Config: { api: { port: 'bar' } } },
  Service: {},
  Log: new Proxy(jest.fn(), { get: (mock) => mock }),
};

describe('HttpServer', () => {
  beforeEach(() => deepMockClear(context));

  it('makes an HTTP server', () => {
    const makeServer = HttpServer(http, express, Router, ApiMiddleware);
    expect(makeServer).toBeInstanceOf(Function);

    const server = makeServer(context);
    expect(server).toBeInstanceOf(Object);
    expect(server).toHaveProperty('server', httpServer);
    expect(server).toHaveProperty('applyRoutes', expect.any(Function));
    expect(server).toHaveProperty('start', expect.any(Function));
    expect(server).toHaveProperty('stop', expect.any(Function));
    expect(Router).toHaveBeenCalledWith(express, 'qux');
    expect(ApiMiddleware).toHaveBeenCalledWith(context.Log);
    expect(express).toHaveBeenCalled();
    expect(router.use).toHaveBeenCalledWith(router);
  });

  it('makes an HTTP server with an auth middleware', () => {
    const mock = jest.fn(() => 'quux');
    const contextWithAuth = {
      ...context,
      Service: {
        AuthService: {
          getUserTokenMiddleware: mock,
        },
      },
    };
    const makeServer = HttpServer(http, express, Router, ApiMiddleware);
    makeServer(contextWithAuth);
    expect(mock).toHaveBeenCalled();
    expect(router.use).toHaveBeenCalledWith('quux');
  });

  describe('.applyRoutes', () => {
    it('applies the supplied routes ', () => {
      const server = HttpServer(http, express, Router, ApiMiddleware)(context);
      const mock = jest.fn();

      server.applyRoutes(mock);
      expect(mock).toHaveBeenCalledWith(router, context.Controller);
    });
  });

  describe('.start', () => {
    it('starts the server', () => {
      const server = HttpServer(http, express, Router, ApiMiddleware)(context);
      expect(httpServer.listen).not.toHaveBeenCalled();

      server.start();
      expect(httpServer.listen).toHaveBeenCalledWith('bar', expect.any(Function));
      expect(context.Log.info).toHaveBeenCalled();
    });
  });

  describe('.stop', () => {
    it('stops the server', async () => {
      const server = HttpServer(http, express, Router, ApiMiddleware)(context);
      server.start();
      expect(httpServer.close).not.toHaveBeenCalled();

      await server.stop();
      expect(httpServer.close).toHaveBeenCalled();
    });
  });
});
