import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

export const requestId = (req: Request, _res: Response, next: NextFunction) => {
  req.requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  next();
};
