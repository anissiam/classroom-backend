import {integer, pgTable, timestamp, varchar} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";
const timeStamps = {
    createdAt:timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
};
export const departments =
    pgTable("departments", {
        id:integer('id').primaryKey().generatedAlwaysAsIdentity(),
        code :varchar('code', {length:50}).notNull().unique(),
        name:varchar('name', {length:255}).notNull(),
        description:varchar('description', {length:255}),
        ...timeStamps
    });

export const subjects =
    pgTable("subjects", {
        id:integer('id').primaryKey().generatedAlwaysAsIdentity(),
        departmentId :integer('department_id').notNull().references(() => departments.id , {onDelete:'restrict'}),
        name:varchar('name', {length:255}).notNull(),
        code :varchar('code', {length:50}).notNull().unique(),
        description:varchar('description', {length:255}),
        ...timeStamps
    });

export const departmentRelationships = relations(departments, ({many}) => ({
    subjects: many(subjects)
}))

export const subjectsRelationships = relations(subjects, ({one,many}) => ({
    departments: one(departments, {fields:[subjects.departmentId], references:[departments.id]}),
}))

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject= typeof subjects.$inferInsert;