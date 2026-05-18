import type { PrismaClient, User, UserRole } from '@prisma/client';

const seedUsers: Array<{ name: string; email: string; role: UserRole }> = [
  {
    name: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN',
  },
  {
    name: 'user',
    email: 'user@example.com',
    role: 'MEMBER',
  },
];

export async function seedUsersData(prisma: PrismaClient): Promise<User> {
  const createdUsers = await Promise.all(
    seedUsers.map((user) =>
      prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }),
    ),
  );

  const adminUser = createdUsers.find((user) => user.role === 'ADMIN');
  if (!adminUser) {
    throw new Error('Seed users are missing required roles.');
  }

  return adminUser;
}
