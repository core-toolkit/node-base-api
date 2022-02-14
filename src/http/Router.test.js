const Router = require('./Router');

const routerMocks = [];

const MAIN_ROOT = 0;
const MAIN_ROUTES = 1;
const SUB_ROOT = 2;
const SUB_ROUTES = 3;
const SUBSUB_ROOT = 4;

const express = {
  json: jest.fn(() => 'json'),
  Router: jest.fn(() => {
    const router = {
      use: jest.fn(() => router),
      get: jest.fn(() => router),
      foo: 'bar',
    };
    routerMocks.push(router);
    return router;
  }),
};
const apiMiddleware = jest.fn();

describe('Router', () => {
  beforeEach(() => {
    routerMocks.splice(0, routerMocks.length);
    apiMiddleware.mockClear();
  });

  it('makes a router', () => {
    const router = Router(express, apiMiddleware);
    expect(router).toBeInstanceOf(Object);
    expect(routerMocks[MAIN_ROOT].use).toHaveBeenCalledTimes(4);
    expect(routerMocks[MAIN_ROUTES].use).not.toHaveBeenCalled();
    expect(routerMocks[MAIN_ROOT].use.mock.calls).toEqual([
      ['json'],
      [expect.any(Object)],
      [expect.any(Function)],
      [expect.any(Function)],
    ]);
    expect(routerMocks[MAIN_ROOT].use.mock.calls[2][0]).toThrow();
    routerMocks[MAIN_ROOT].use.mock.calls[3][0]('foo', 'bar', 'baz', 'qux');
    expect(apiMiddleware).toHaveBeenCalledWith({ error: 'foo' }, 'bar', 'baz', 'qux');
  });

  describe('.sub()', () => {
    it('creates sub-routers', () => {
      const router = Router(express, apiMiddleware);
      expect(router).toHaveProperty('sub', expect.any(Function));

      const sub = router.sub('/sub');
      expect(sub).not.toBe(router);
      expect(sub).toBeInstanceOf(Object);

      expect(routerMocks[MAIN_ROOT].use).toHaveBeenCalledTimes(4);
      expect(routerMocks[MAIN_ROUTES].use).toHaveBeenCalledTimes(1);
      expect(routerMocks[MAIN_ROUTES].use).toHaveBeenCalledWith('/sub', sub);
      expect(routerMocks[SUB_ROOT].use).toHaveBeenCalledTimes(2);
    });

    it('creates sub-routers of sub-routers', () => {
      const router = Router(express, apiMiddleware);
      expect(router).toHaveProperty('sub', expect.any(Function));

      const sub = router.sub('/sub');
      const subsub = sub.sub('/subsub');
      expect(subsub).not.toBe(router);
      expect(subsub).not.toBe(sub);
      expect(subsub).toBeInstanceOf(Object);

      expect(routerMocks[MAIN_ROOT].use).toHaveBeenCalledTimes(4);
      expect(routerMocks[MAIN_ROUTES].use).toHaveBeenCalledTimes(1);
      expect(routerMocks[MAIN_ROUTES].use).toHaveBeenCalledWith('/sub', sub);
      expect(routerMocks[SUB_ROOT].use).toHaveBeenCalledTimes(2);

      expect(routerMocks[SUB_ROUTES].use).toHaveBeenCalledTimes(1);
      expect(routerMocks[SUB_ROUTES].use).toHaveBeenCalledWith('/subsub', subsub);
      expect(routerMocks[SUBSUB_ROOT].use).toHaveBeenCalledTimes(2);
    });
  });

  describe('.VERB()', () => {
    it('wraps HTTP verb methods', async () => {
      const router = Router(express, apiMiddleware);
      expect(router).toHaveProperty('get', expect.any(Function));
      expect(router.get).not.toBe(routerMocks[MAIN_ROUTES].get);

      const mockHandler = jest.fn(() => 'foo');
      const mockMiddleware = jest.fn();
      const chain = router.get('/get', mockMiddleware, mockHandler);
      expect(routerMocks[MAIN_ROUTES].get).toHaveBeenCalledWith('/get', mockMiddleware, expect.any(Function));
      expect(chain).toBe(router);

      const [, receivedMiddleware, receivedHandler] = routerMocks[MAIN_ROUTES].get.mock.calls[0];
      expect(receivedMiddleware).toBe(mockMiddleware);
      expect(receivedHandler).not.toBe(mockHandler);
      await receivedHandler('bar', 'baz');
      expect(mockHandler).toHaveBeenCalledWith('bar', 'baz');
      expect(apiMiddleware).toHaveBeenLastCalledWith(expect.objectContaining({ data: 'foo' }), 'bar', 'baz');

      mockHandler.mockRejectedValueOnce(123);
      await receivedHandler('bar', 'baz');
      expect(mockHandler).toHaveBeenCalledTimes(2);
      expect(apiMiddleware).toHaveBeenLastCalledWith(expect.objectContaining({ error: 123 }), 'bar', 'baz');
    });

    it('does not wrap error middleware', async () => {
      const router = Router(express, apiMiddleware);
      const mock = jest.fn((err, req, res, next) => 'foo');
      router.get('/get', mock);
      expect(routerMocks[MAIN_ROUTES].get).toHaveBeenCalledWith('/get', mock);
    });
  });

  describe('.PROPERTY', () => {
    it('forwards non-HTTP verb properties', () => {
      const router = Router(express, apiMiddleware);
      expect(router).toHaveProperty('use', routerMocks[MAIN_ROUTES].use);
      expect(router).toHaveProperty('json', routerMocks[MAIN_ROUTES].json);
    });
  });
});
