export type User = {
  id: string;
  name: string;
};

export const users: User[] = [
  { id: "1", name: "User 1" },
  { id: "2", name: "User 2" },
  { id: "3", name: "User 3" },
];

export async function getUsers(): Promise<User[]> {
  console.log("Fetching users...");
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
  return users;
}

export async function getUserById(id: string): Promise<User | undefined> {
  console.log(`Fetching user by id: ${id}`);
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  return users.find((user) => user.id === id);
}
