import {
  requireCurrentUser,
  requireAdminUser,
  type AuthenticatedUser,
} from './account-access';

export function authenticatedAction<Args extends unknown[], R>(
  action: (user: AuthenticatedUser, ...args: Args) => Promise<R>,
) {
  return async (...args: Args): Promise<R> => {
    const user = await requireCurrentUser();

    return action(user as AuthenticatedUser, ...args);
  };
}

export function adminAction<Args extends unknown[], R>(
  action: (admin: AuthenticatedUser, ...args: Args) => Promise<R>,
) {
  return async (...args: Args): Promise<R> => {
    const admin = await requireAdminUser();

    return action(admin as AuthenticatedUser, ...args);
  };
}
