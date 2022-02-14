const ApiMiddleware = require('./ApiMiddleware');
const Errors = require('../http/Errors');

const mocks = {
  status: jest.fn(),
  send: jest.fn(),
  next: jest.fn(),
};

const logger = { error: jest.fn() };

describe('ApiMiddleware', () => {
  beforeEach(() => Object.keys(mocks).forEach((method) => mocks[method].mockClear()));

  it('makes an API middleware', () => {
    const middleware = ApiMiddleware(logger);
    expect(middleware).toBeInstanceOf(Function);
  });

  it('sends responses', () => {
    const middleware = ApiMiddleware(logger);
    middleware({ data: 'foo' }, undefined, mocks, mocks.next);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ data: 'foo', error: null }));
    expect(mocks.next).not.toHaveBeenCalled();
  });

  it('sends empty responses', () => {
    const middleware = ApiMiddleware(logger);
    middleware({}, undefined, mocks, mocks.next);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ data: null, error: null }));
    expect(mocks.next).not.toHaveBeenCalled();
  });

  it('sends error responses', () => {
    const error = new class extends Errors.BaseError {
      code = 418;
      constructor() {
        super('Custom error');
      }
    };

    const middleware = ApiMiddleware(logger);
    middleware({ error }, undefined, mocks, mocks.next);
    expect(mocks.status).toHaveBeenCalledWith(418);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      data: null,
      error: expect.objectContaining({ message: 'Custom error' }),
    }));
    expect(mocks.next).not.toHaveBeenCalled();
  });

  it('sends validation error responses', () => {
    const error = new Errors.Validation();
    error.add('foo');

    const middleware = ApiMiddleware(logger);
    middleware({ error }, undefined, mocks, mocks.next);
    expect(mocks.status).toHaveBeenCalledWith(400);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      data: null,
      error: expect.objectContaining({
        validations: [expect.objectContaining({ field: 'foo' })],
      }),
    }));
    expect(mocks.next).not.toHaveBeenCalled();
  });

  it('sends generic error responses', () => {
    const error = new Error('secret');

    const middleware = ApiMiddleware(logger);
    middleware({ error }, undefined, mocks, mocks.next);
    expect(mocks.status).toHaveBeenCalledWith(500);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      data: null,
      error: expect.objectContaining({ message: expect.not.stringContaining('secret') }),
    }));
    expect(mocks.next).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenLastCalledWith(error);
  });

  it('does not send responses if a response has already been sent', () => {
    const middleware = ApiMiddleware(logger);
    middleware({ data: 'foo', error: 'bar' }, undefined, { ...mocks, headersSent: true }, mocks.next);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.next).toHaveBeenCalledWith('bar');
  });
});
