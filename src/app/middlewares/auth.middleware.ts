import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { UserModel } from "../../generated/prisma/models";
import AppError from "../errors/AppError";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { CookieUtils } from "../utils/cookie";

export const checkAuth =
  (...authRoles: Role[]) =>
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        // 1. Try resolving session via Better Auth's official helper
        let user: UserModel | null = null;

        try {
          const sessionData = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
          });
          if (sessionData && sessionData.user) {
            user = sessionData.user as unknown as UserModel;
          }
        } catch {
          // Fallback to direct DB lookup
        }

        // 2. Fallback: Parse token from Authorization header or cookie
        if (!user) {
          const authHeader = req.headers.authorization;
          const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7).trim()
            : undefined;

          const rawCookie = CookieUtils.getCookie(req, "better-auth.session_token");
          const cookieToken = rawCookie ? rawCookie.split(".")[0] : undefined;

          const tokensToTry = [bearerToken, cookieToken].filter(Boolean) as string[];

          if (tokensToTry.length === 0) {
            throw new AppError(status.UNAUTHORIZED, "Unauthorized access! No session token provided.");
          }

          for (const token of tokensToTry) {
            const sessionExists = await prisma.session.findFirst({
              where: {
                token,
                expiresAt: {
                  gt: new Date(),
                },
              },
              include: {
                user: true,
              },
            });

            if (sessionExists && sessionExists.user) {
              user = sessionExists.user;
              break;
            }
          }

          if (!user) {
            throw new AppError(status.UNAUTHORIZED, "Unauthorized access! Invalid or expired session.");
          }
        }

        if (user.status === UserStatus.BLOCKED || user.status === UserStatus.DELETED) {
          throw new AppError(status.UNAUTHORIZED, "Unauthorized access! User is not active.");
        }

        if (user.isDeleted) {
          throw new AppError(status.UNAUTHORIZED, "Unauthorized access! User is deleted.");
        }

        if (authRoles.length > 0 && !authRoles.includes(user.role as Role)) {
          throw new AppError(status.FORBIDDEN, "Forbidden access! You do not have permission to access this resource.");
        }

        req.user = {
          userId: user.id,
          role: user.role as Role,
          email: user.email,
          tenantId: user.tenantId,
          isOwner: user.isOwner,
          isSuperAdmin: user.isSuperAdmin,
        };

        next();
      } catch (error) {
        next(error);
      }
    };

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const rawCookie = CookieUtils.getCookie(req, "better-auth.session_token");
    const authHeader = req.headers.authorization;

    // Fast-path: if no cookie and no authorization header, skip session check completely
    if (!rawCookie && !authHeader) {
      return next();
    }

    let user: UserModel | null = null;

    try {
      const sessionData = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (sessionData && sessionData.user) {
        user = sessionData.user as unknown as UserModel;
      }
    } catch {
      // Fallback
    }

    if (!user) {
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7).trim()
        : undefined;
      const cookieToken = rawCookie ? rawCookie.split(".")[0] : undefined;
      const tokensToTry = [bearerToken, cookieToken].filter(Boolean) as string[];

      for (const token of tokensToTry) {
        const sessionExists = await prisma.session.findFirst({
          where: {
            token,
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            user: true,
          },
        });

        if (sessionExists && sessionExists.user) {
          user = sessionExists.user;
          break;
        }
      }
    }

    if (user && !user.isDeleted && user.status === UserStatus.ACTIVE) {
      req.user = {
        userId: user.id,
        role: user.role as Role,
        email: user.email,
        tenantId: user.tenantId,
        isOwner: user.isOwner,
        isSuperAdmin: user.isSuperAdmin,
      };
    }
  } catch {
    // Continue without req.user for optional authentication
  }

  next();
};
