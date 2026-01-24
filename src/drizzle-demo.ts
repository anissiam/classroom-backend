import { eq } from 'drizzle-orm';
import { index, pool } from './db';
import { demoUsers } from './db/schema';

async function main() {
  try {
    console.log('Performing CRUD operations...');

    // CREATE: Insert a new user
    const [newUser] = await index
      .insert(demoUsers)
      .values({ name: 'Admin User', email: 'admin@example.com' })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }
    console.log('✅ CREATE: New user created:', newUser);

    // READ: Select the user
    const found = await index
      .select()
      .from(demoUsers)
      .where(eq(demoUsers.id, newUser.id));
    console.log('✅ READ: Found user:', found[0]);

    // UPDATE: Change the user's name
    const [updated] = await index
      .update(demoUsers)
      .set({ name: 'Super Admin' })
      .where(eq(demoUsers.id, newUser.id))
      .returning();

    if (!updated) {
      throw new Error('Failed to update user');
    }
    console.log('✅ UPDATE: User updated:', updated);

    // DELETE: Remove the user
    await index.delete(demoUsers).where(eq(demoUsers.id, newUser.id));
    console.log('✅ DELETE: User deleted.');

    console.log('\nCRUD operations completed successfully.');
  } catch (error) {
    console.error('❌ Error performing CRUD operations:', error);
    process.exitCode = 1;
  } finally {
    // Close pool if it exists (not applicable for Neon HTTP, but keeps API compatible)
    try {
      if (pool && typeof (pool as any).end === 'function') {
        await (pool as any).end();
        console.log('Database pool closed.');
      }
    } catch (e) {
      // ignore
    }
  }
}

main();
