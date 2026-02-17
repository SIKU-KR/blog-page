import { type ZodIssue, type ZodType } from 'zod';
import { logger } from '@/lib/utils/logger';

export interface ContractValidationIssue {
  code: string;
  path: string;
  message: string;
}

const ROOT_PATH = '$';

export const formatContractValidationIssues = (issues: ZodIssue[]): ContractValidationIssue[] => {
  return issues.map(issue => ({
    code: issue.code,
    path: issue.path.length > 0 ? issue.path.map(String).join('.') : ROOT_PATH,
    message: issue.message,
  }));
};

export const parseBoundaryContract = <T>(response: T, schema: ZodType<T>, contract: string): T => {
  const parsed = schema.safeParse(response);

  if (parsed.success) {
    return parsed.data;
  }

  if (process.env.NODE_ENV === 'development') {
    const issues = formatContractValidationIssues(parsed.error.issues);

    logger.warn('API 경계 계약 검증 실패 - 원본 응답으로 폴백', {
      contract,
      issueCount: issues.length,
      issues,
    });
  }

  return response;
};
