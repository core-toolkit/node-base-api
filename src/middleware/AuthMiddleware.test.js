const AuthMiddleware = require('./AuthMiddleware');

describe('AuthMiddleware', () => {
  it('allows authenticated requests', () => {
    const next = jest.fn();
    AuthMiddleware({ user: { id: 123 } }, undefined, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks unauthenticated requests', () => {
    const next = jest.fn();
    AuthMiddleware({ user: {} }, undefined, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
