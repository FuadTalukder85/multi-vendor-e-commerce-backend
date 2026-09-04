import status from "http-status";
import { TErrorResponse, TErrorSources } from "../types/error.types";

interface PrismaClientKnownRequestError {
  code: string;
  meta?: Record<string, unknown>;
  message: string;
}

const prismaErrorMap: Record<string, { statusCode: number; message: string }> = {
  P2002: { statusCode: status.CONFLICT, message: "A record with this value already exists" },
  P2003: { statusCode: status.BAD_REQUEST, message: "Foreign key constraint failed" },
  P2025: { statusCode: status.NOT_FOUND, message: "Record not found" },
  P2014: { statusCode: status.BAD_REQUEST, message: "Required relation violation" },
  P2016: { statusCode: status.BAD_REQUEST, message: "Query interpretation error" },
};

export const handlePrismaError = (err: PrismaClientKnownRequestError): TErrorResponse => {
  const mapped = prismaErrorMap[err.code];

  const statusCode = mapped?.statusCode ?? status.INTERNAL_SERVER_ERROR;
  const message = mapped?.message ?? "Database error";

  const errorSources: TErrorSources[] = [
    {
      path: "",
      message: mapped ? `${mapped.message} (${err.code})` : err.message,
    },
  ];

  if (err.code === "P2002" && err.meta?.target) {
    const fields = Array.isArray(err.meta.target) ? (err.meta.target as string[]).join(", ") : String(err.meta.target);
    errorSources[0].message = `Duplicate value for field(s): ${fields}`;
  }

  return {
    success: false,
    message,
    errorSources,
    statusCode,
  };
};
