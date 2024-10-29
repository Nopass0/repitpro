import { z } from "zod";
import { cache } from "./Cache";

// Типы ошибок
export enum ErrorCode {
  // Общие ошибки
  UNKNOWN = "UNKNOWN_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  DATABASE = "DATABASE_ERROR",
  NETWORK = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",

  // Ошибки бизнес-логики
  INVALID_TOKEN = "INVALID_TOKEN",
  STUDENT_EXISTS = "STUDENT_EXISTS",
  GROUP_CREATION_FAILED = "GROUP_CREATION_FAILED",
  SCHEDULE_CREATION_FAILED = "SCHEDULE_CREATION_FAILED",
  FILE_PROCESSING_FAILED = "FILE_PROCESSING_FAILED",

  // Ошибки данных
  INVALID_DATA = "INVALID_DATA",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_DATE = "INVALID_DATE",
}

// Интерфейс для структурированной ошибки
interface StructuredError {
  code: ErrorCode;
  message: string;
  timestamp: string;
  details?: any;
  stack?: string;
}

// Класс для кастомных ошибок
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Кэш для предотвращения дублирования логов
const errorCache = new Set<string>();
const ERROR_CACHE_TIMEOUT = 60000; // 1 минута

// Форматирование ошибки в структурированный объект
function formatError(error: unknown): StructuredError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
      details: error.details,
      stack: error.stack,
    };
  }

  if (error instanceof z.ZodError) {
    return {
      code: ErrorCode.VALIDATION,
      message: "Validation failed",
      timestamp: new Date().toISOString(),
      details: error.errors,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      code: ErrorCode.UNKNOWN,
      message: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    };
  }

  return {
    code: ErrorCode.UNKNOWN,
    message: String(error),
    timestamp: new Date().toISOString(),
  };
}

// Генерация уникального ключа для ошибки
function generateErrorKey(error: StructuredError): string {
  return `${error.code}:${error.message}:${error.stack?.slice(0, 100) || ""}`;
}

// Проверка, нужно ли логировать ошибку
function shouldLogError(errorKey: string): boolean {
  if (errorCache.has(errorKey)) {
    return false;
  }

  errorCache.add(errorKey);
  setTimeout(() => errorCache.delete(errorKey), ERROR_CACHE_TIMEOUT);
  return true;
}

// Основная функция логирования
async function logError(structuredError: StructuredError): Promise<void> {
  try {
    // В продакшене здесь может быть интеграция с сервисом логирования
    // Например, Sentry, LogRocket, CloudWatch и т.д.
    console.error("[ERROR]", JSON.stringify(structuredError, null, 2));

    // Можно добавить отправку критических ошибок в слак или на почту
    if (isErrorCritical(structuredError)) {
      await notifyTeam(structuredError);
    }
  } catch (loggingError) {
    // Если падает само логирование, выводим в консоль
    console.error("Error logging failed:", loggingError);
    console.error("Original error:", structuredError);
  }
}

// Проверка критичности ошибки
function isErrorCritical(error: StructuredError): boolean {
  const criticalCodes = [
    ErrorCode.DATABASE,
    ErrorCode.GROUP_CREATION_FAILED,
    ErrorCode.SCHEDULE_CREATION_FAILED,
  ];
  return criticalCodes.includes(error.code);
}

// Заглушка для уведомления команды
async function notifyTeam(error: StructuredError): Promise<void> {
  // TODO: Реализовать интеграцию с системой уведомлений
  console.warn("[CRITICAL ERROR]", error);
}

// Публичная функция для захвата и обработки ошибок
export function capture(error: unknown): void {
  const structuredError = formatError(error);
  const errorKey = generateErrorKey(structuredError);

  if (shouldLogError(errorKey)) {
    logError(structuredError).catch(console.error);
  }
}

// Вспомогательная функция для создания ошибок бизнес-логики
export function createError(
  code: ErrorCode,
  message: string,
  details?: any
): AppError {
  return new AppError(code, message, details);
}

// Функция для обработки ошибок в async функциях
export async function tryAsync<T>(
  operation: () => Promise<T>,
  errorCode: ErrorCode = ErrorCode.UNKNOWN
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw createError(
      errorCode,
      error instanceof Error ? error.message : "Unexpected error occurred",
      error
    );
  }
}

// Функция для безопасного выполнения синхронного кода
export function trySafe<T>(
  operation: () => T,
  errorCode: ErrorCode = ErrorCode.UNKNOWN
): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw createError(
      errorCode,
      error instanceof Error ? error.message : "Unexpected error occurred",
      error
    );
  }
}
