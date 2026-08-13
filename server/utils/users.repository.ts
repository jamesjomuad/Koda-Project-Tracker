import { getPrisma } from './db';
import { notFound } from './errors';
import type { User, UserPayload } from '#shared/types/user';

const USER_SELECT = { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } as const;

function toUser(row: { id: number; name: string; email: string; role: string; createdAt: Date; updatedAt: Date }): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as User['role'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listUsers(): Promise<User[]> {
  const rows = await getPrisma().user.findMany({ orderBy: { name: 'asc' }, select: USER_SELECT });
  return rows.map(toUser);
}

export async function getUser(id: number): Promise<User> {
  const user = await getPrisma().user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw notFound('User');
  return toUser(user);
}

export async function createUser(payload: UserPayload): Promise<User> {
  const user = await getPrisma().user.create({
    data: { name: payload.name, email: payload.email, role: payload.role },
    select: USER_SELECT,
  });
  return toUser(user);
}

export async function updateUser(id: number, payload: UserPayload): Promise<User> {
  try {
    const user = await getPrisma().user.update({
      where: { id },
      data: { name: payload.name, email: payload.email, role: payload.role },
      select: USER_SELECT,
    });
    return toUser(user);
  } catch {
    throw notFound('User');
  }
}

export async function deleteUser(id: number): Promise<void> {
  try {
    await getPrisma().user.delete({ where: { id } });
  } catch {
    throw notFound('User');
  }
}

export async function countUsers(): Promise<number> {
  return getPrisma().user.count();
}

export async function seedUsers(): Promise<number> {
  const users: UserPayload[] = [
    { name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
    { name: 'Bob Smith', email: 'bob@example.com', role: 'member' },
    { name: 'Carol Davis', email: 'carol@example.com', role: 'member' },
    { name: 'David Lee', email: 'david@example.com', role: 'member' },
    { name: 'Eva Martinez', email: 'eva@example.com', role: 'member' },
  ];
  for (const user of users) {
    try {
      await getPrisma().user.create({ data: user });
    } catch {
      // skip duplicates
    }
  }
  return users.length;
}
