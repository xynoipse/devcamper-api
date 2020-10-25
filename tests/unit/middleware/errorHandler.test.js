const errorHandler = require('../../../middleware/errorHandler');

describe('errorHandler middleware', () => {
  let err;
  const req = {};
  let res;
  const next = jest.fn();

  beforeEach(() => {
    err = { name: 'Error' };

    res = {
      status(status) {
        this.status = status;
        return this;
      },
      json(body) {
        this.body = body;
      },
    };
  });

  it('should return 404 if there is a objectid casterror', () => {
    err = { name: 'CastError', kind: 'ObjectId' };

    errorHandler(err, req, res, next);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Resource not found/);
    expect(res.body.errors).not.toBeDefined();
  });

  it('should return 400 if there is a duplicate key error collection', () => {
    err = { code: 11000 };

    errorHandler(err, req, res, next);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Duplicate field value entered/);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 400 if there is a validation error', () => {
    err = { name: 'ValidationError' };

    errorHandler(err, req, res, next);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/The given data was invalid/);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 500 if there is a server error', () => {
    err = { name: 'Error' };

    errorHandler(err, req, res, next);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Server Error/);
    expect(res.body.errors).not.toBeDefined();
  });
});
