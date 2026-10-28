export function databaseErrorCode(error: any) {
  return error?.driverError?.code ?? error?.code;
}

export function databaseErrorMessage(error: any) {
  return String(error?.driverError?.sqlMessage ?? error?.driverError?.message ?? error?.message ?? '');
}

export function isDuplicateEmailError(error: any) {
  return databaseErrorCode(error) === 'ER_DUP_ENTRY'
    || /UNIQUE constraint failed: (students|auth_users)\.email/.test(databaseErrorMessage(error))
    || /Duplicate entry .* for key '.*(students|auth_users).*email'/.test(databaseErrorMessage(error));
}

export function isDuplicateCourseError(error: any) {
  return databaseErrorCode(error) === 'ER_DUP_ENTRY'
    || /UNIQUE constraint failed: courses\.(id|code)/.test(databaseErrorMessage(error))
    || /Duplicate entry .* for key '.*courses.*'/.test(databaseErrorMessage(error));
}
