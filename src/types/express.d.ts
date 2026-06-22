import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        // Add other properties if your middleware injects them, for example:
        // email?: string;
        // role?: string;
      };
    }
  }
}

