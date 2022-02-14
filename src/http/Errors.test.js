const Errors = require('./Errors');

describe('Errors', () => {
  describe('BaseError', () => {
    it('is a valid Error', () => {
      const error = new Errors.BaseError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Validation', () => {
    it('is a valid BaseError', () => {
      const error = new Errors.Validation();
      expect(error).toBeInstanceOf(Errors.BaseError);
    });

    describe('.add()', () => {
      it('adds validation errors', () => {
        const error = new Errors.Validation();
        error.add('foo', 'bar', 'baz');
      });
    });

    describe('.validations', () => {
      it('contains all validation errors', () => {
        const error = new Errors.Validation();
        expect(error.validations).toEqual([]);

        error.add('foo', 'bar', 'baz');
        error.add('zxc', 'asd', 'qwe');
        expect(error.validations).toEqual([
          expect.objectContaining({ field: 'foo', reason: 'bar', hint: 'baz' }),
          expect.objectContaining({ field: 'zxc', reason: 'asd', hint: 'qwe' }),
        ]);
      });
    });

    describe('.invalid', () => {
      it('is true if there are failed validations', () => {
        const error = new Errors.Validation();
        error.add('foo');
        expect(error.invalid).toBe(true);

      });

      it('is false if there are no failed validations', () => {
        const error = new Errors.Validation();
        expect(error.invalid).toBe(false);
      });
    });
  });

  describe('Unauthorized', () => {
    it('is a valid BaseError', () => {
      const error = new Errors.Unauthorized();
      expect(error).toBeInstanceOf(Errors.BaseError);
    });
  });

  describe('Forbidden', () => {
    it('is a valid BaseError', () => {
      const error = new Errors.Forbidden();
      expect(error).toBeInstanceOf(Errors.BaseError);
    });
  });

  describe('NotFound', () => {
    it('is a valid BaseError', () => {
      const error = new Errors.NotFound();
      expect(error).toBeInstanceOf(Errors.BaseError);
    });
  });

});
