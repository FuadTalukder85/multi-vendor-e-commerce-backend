import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { Role, UserStatus } from "../../generated/prisma/enums";
import AppError from "../errors/AppError";
import { prisma } from "../lib/prisma";
import { CookieUtils } from "../utils/cookie";

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");

      if (!sessionToken) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access! No session token provided.");
      }

      const sessionExists = await prisma.session.findFirst({
        where: {
          token: sessionToken,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!sessionExists || !sessionExists.user) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access! Invalid or expired session.");
      }

      const user = sessionExists.user;

      if (user.status === UserStatus.BLOCKED || user.status === UserStatus.DELETED) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access! User is not active.");
      }

      if (user.isDeleted) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access! User is deleted.");
      }

      if (authRoles.length > 0 && !authRoles.includes(user.role)) {
        throw new AppError(status.FORBIDDEN, "Forbidden access! You do not have permission to access this resource.");
      }

      req.user = {
        userId: user.id,
        role: user.role,
        email: user.email,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
