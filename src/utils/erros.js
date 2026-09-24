export function formatFirebaseError(message, error) {
  return error?.code ? `${message} (${error.code})` : message;
}
