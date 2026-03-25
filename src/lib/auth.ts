import { Lucia } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { getDb } from "@/db/db";
import { sessions, users } from "@/db/schema";

export function initializeLucia(db: ReturnType<typeof getDb>) {
  const adapter = new DrizzleSQLiteAdapter(db, sessions, users);
  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === "production",
      },
    },
    getUserAttributes: (attributes) => {
      return {
        email: attributes.email,
        displayName: attributes.displayName,
      };
    },
  });
}

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>;
    DatabaseUserAttributes: {
      email: string;
      displayName: string;
    };
  }
}
