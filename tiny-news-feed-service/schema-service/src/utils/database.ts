import { DataSource } from 'typeorm'
import { Client } from 'pg'

import dotenv from 'dotenv'
import { User } from '../schemas/User'
import { Follower } from '../schemas/Follower'
import { Post } from '../schemas/Post'

dotenv.config({
  path: '.env.dev'
})

const targetSchema = process.env.DB_SCHEMA || 'public'

const sanitizeIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`

const buildPgConfig = () => ({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER_NAME,
  password: process.env.DB_USER_PASS,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
})

const PostgreSQLDatasource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USER_NAME,
    password: process.env.DB_USER_PASS,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10): 5432,
    synchronize:true,
    schema: targetSchema,
    entities: [User, Follower, Post],
})

export const ensureSchemaExists = async () => {
  if (!targetSchema || targetSchema === 'public') {
    return
  }

  const client = new Client(buildPgConfig())

  try {
    await client.connect()
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${sanitizeIdentifier(targetSchema)}`)
  } finally {
    await client.end()
  }
}


export const initiateConnection = async () => {
  
  try {
      await ensureSchemaExists()
      await PostgreSQLDatasource.initialize()
      console.log("Data Source has been initialized!")
    } catch (error) {
      console.error("Error during Data Source initialization", error)
  }

}



export default PostgreSQLDatasource;
