import {DataSource} from 'typeorm'

import  dotenv from 'dotenv'
import { User } from '../login/user.model';

dotenv.config({
  path: '.env.dev'
})


const PostgreSQLDatasource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USER_NAME,
    password: process.env.DB_USER_PASS,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10): 5432,
    entities: [User]
})


export default PostgreSQLDatasource;