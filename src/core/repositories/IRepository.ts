/**
 * Generic Interface for Repositories.
 * This allows us to switch from Prisma to any other ORM or Database 
 * without changing the application's business logic.
 */
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}
