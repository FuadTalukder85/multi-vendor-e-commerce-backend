import { NextFunction, Request, Response } from "express";
import z from "zod";

type ValidationTarget = "body" | "query" | "params";

export const validateRequest = (zodSchema: z.ZodType, target: ValidationTarget = "body") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    let data: unknown;

    if (target === "body") {
      data = req.body.data ? JSON.parse(req.body.data as string) : req.body;
    } else if (target === "query") {
      data = req.query;
    } else {
      data = req.params;
    }

    const parsedResult = zodSchema.safeParse(data);

    if (!parsedResult.success) {
      next(parsedResult.error);
      return;
    }

    if (target === "body") {
      req.body = parsedResult.data;
    }

    next();
  };
};
