import { z } from 'zod';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

function isNextControlFlowError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const digest =
    'digest' in error && typeof error.digest === 'string'
      ? error.digest
      : null;

  return Boolean(
    digest &&
      (digest.startsWith('NEXT_REDIRECT') ||
        digest.startsWith('NEXT_HTTP_ERROR_FALLBACK'))
  );
}

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    try {
      const result = schema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return { error: result.error.issues[0].message };
      }

      return await action(result.data, formData);
    } catch (error) {
      if (isNextControlFlowError(error)) {
        throw error;
      }
      console.error('[validatedAction] Action failed', error);
      return { error: 'Something went wrong. Please try again.' };
    }
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    try {
      const user = await getUser();
      if (!user) {
        return { error: 'Your session has expired. Please sign in again.' };
      }

      const result = schema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return { error: result.error.issues[0].message };
      }

      return await action(result.data, formData, user);
    } catch (error) {
      if (isNextControlFlowError(error)) {
        throw error;
      }
      console.error('[validatedActionWithUser] Action failed', error);
      return { error: 'Something went wrong. Please try again.' };
    }
  };
}

type ActionWithTeamFunction<T> = (
  formData: FormData,
  team: TeamDataWithMembers
) => Promise<T>;

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    const team = await getTeamForUser();
    if (!team) {
      throw new Error('Team not found');
    }

    return action(formData, team);
  };
}
