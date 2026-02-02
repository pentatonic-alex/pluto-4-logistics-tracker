import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Simple single-user auth for MVP
        const validEmail = process.env.APP_USER_EMAIL;
        const passwordHash = process.env.APP_USER_PASSWORD_HASH;

        if (!validEmail || !passwordHash) {
          console.error('Auth credentials not configured in environment');
          return null;
        }

        if (email !== validEmail) {
          return null;
        }

        const isValid = await bcrypt.compare(password, passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: '1',
          email: validEmail,
          name: 'Project Manager',
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
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
});
