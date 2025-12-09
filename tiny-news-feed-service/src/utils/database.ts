import { DataSource } from 'typeorm'
import { Client } from 'pg'

import { User } from '../schemas/User'
import { Follower } from '../schemas/Follower'
import { Post } from '../schemas/Post'
import { appEnv } from './env'

const targetSchema = appEnv.db.schema || 'public'

const sanitizeIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`

const buildPgConfig = () => ({
  host: appEnv.db.host,
  database: appEnv.db.name,
  user: appEnv.db.username,
  password: appEnv.db.password,
  port: appEnv.db.port,
})

const PostgreSQLDatasource = new DataSource({
    type: "postgres",
    host: appEnv.db.host,
    database: appEnv.db.name,
    username: appEnv.db.username,
    password: appEnv.db.password,
    port: appEnv.db.port,
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
