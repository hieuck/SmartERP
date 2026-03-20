import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import type { NextFunction, Request, Response } from 'express';
import { LoggingMiddleware } from './logging.middleware';

describe('LoggingMiddleware', () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    jest.restoreAllMocks();
  });

  function createResponse(statusCode: number) {
    const response = new EventEmitter() as Response & EventEmitter;
    response.statusCode = statusCode;
    return response;
  }

  it('skips success logs for health endpoints in development', () => {
    process.env.NODE_ENV = 'development';
    const middleware = new LoggingMiddleware();
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const req = { method: 'GET', originalUrl: '/api/health' } as Request;
    const res = createResponse(200);
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('still logs non-health errors', () => {
    process.env.NODE_ENV = 'development';
    const middleware = new LoggingMiddleware();
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const req = { method: 'GET', originalUrl: '/api/orders' } as Request;
    const res = createResponse(500);
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[GET] /api/orders - 500 -'));
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('downgrades refresh token misses to expected logs', () => {
    process.env.NODE_ENV = 'development';
    const middleware = new LoggingMiddleware();
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const req = { method: 'POST', originalUrl: '/api/auth/refresh' } as Request;
    const res = createResponse(401);
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('EXPECTED [POST] /api/auth/refresh - 401 -'),
    );
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
