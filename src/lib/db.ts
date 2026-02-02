import { neon } from '@neondatabase/serverless';

/**
 * SQL query function using tagged template literals
 * 
 * Usage:
 *   const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
 *   const campaigns = await sql`SELECT * FROM campaign_projections WHERE status = ${status}`;
 * 
 * Parameters are automatically escaped to prevent SQL injection.
 */
export const sql = neon(process.env.DATABASE_URL!);
