import NextAuth, { type NextAuthOptions, type Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compareSync, hashSync } from 'bcryptjs';
import { initializeDatabase, runQuerySingle, executeQuery } from '@/lib/db';
import { JWT } from 'next-auth/jwt';

// Extend NextAuth types to include id
declare module 'next-auth' {
  interface User {
    id?: string;
  }
  interface Session {
    user: {
      id?: string;
      email?: string;
      name?: string;
      image?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        try {
          await initializeDatabase();

          // Check if user exists
          const user = await runQuerySingle<{ id: number; email: string; password_hash: string; name: string }>(
            'SELECT id, email, password_hash, name FROM auth_users WHERE email = ? LIMIT 1',
            [credentials.email]
          );

          if (!user) {
            throw new Error('User not found');
          }

          // Verify password
          const isPasswordValid = compareSync(credentials.password, user.password_hash || '');
          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name || user.email.split('@')[0],
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
