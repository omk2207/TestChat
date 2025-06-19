import mysql from "mysql2/promise"

// Create a connection pool with better error handling
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS, // Support both naming conventions
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

export async function query(sql: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(sql, params)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    console.error("Query:", sql)
    console.error("Params:", JSON.stringify(params))
    throw error
  }
}

// Test database connection with detailed error reporting
export async function testConnection() {
  try {
    console.log("Testing database connection...")
    console.log(`Host: ${process.env.DB_HOST || "localhost"}`)
    console.log(`User: ${process.env.DB_USER}`)
    console.log(`Database: ${process.env.DB_NAME}`)

    await pool.query("SELECT 1")
    console.log("Database connection successful")
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// Get database configuration (safe for client)
export function getDbConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
  }
}

export default { query, testConnection, getDbConfig }

