/**
 * Input Validation Utilities
 * Server-side validation for API routes
 */

export class ValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  status = 404;

  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  status = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: { page?: number; size?: number }): string[] {
  const errors: string[] = [];
  const { page, size } = params;

  if (page !== undefined) {
    if (typeof page !== 'number' || isNaN(page) || page < 0) {
      errors.push('Page must be a non-negative integer');
    }
  }

  if (size !== undefined) {
    if (typeof size !== 'number' || isNaN(size) || size < 1 || size > 100) {
      errors.push('Size must be between 1 and 100');
    }
  }

  return errors;
}

/**
 * Validate sorting parameters
 */
export function validateSorting(sort: string, allowedFields: string[]): string[] {
  const errors: string[] = [];

  if (!sort || typeof sort !== 'string') {
    errors.push('Sort parameter must be a string');
    return errors;
  }

  const [field, direction = 'desc'] = sort.split(',');

  if (!allowedFields.includes(field)) {
    errors.push(`Sort field must be one of: ${allowedFields.join(', ')}`);
  }

  if (!['asc', 'desc'].includes(direction.toLowerCase())) {
    errors.push('Sort direction must be "asc" or "desc"');
  }

  return errors;
}

/**
 * Validate post creation/update data
 */
export function validatePostData(data: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Content is required');
  }

  if (!data.summary || typeof data.summary !== 'string' || data.summary.trim().length === 0) {
    errors.push('Summary is required');
  }

  if (!data.state || !['draft', 'published'].includes(data.state as string)) {
    errors.push('State must be "draft" or "published"');
  }

  if (data.slug && typeof data.slug === 'string') {
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(data.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
  }

  return errors;
}

/**
 * Validate login credentials
 */
export function validateLoginData(data: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!data.username || typeof data.username !== 'string') {
    errors.push('Username is required');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  }

  return errors;
}

/**
 * Parse numeric ID from string
 */
export function parseId(id: string | undefined): number | null {
  if (!id) return null;
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}
