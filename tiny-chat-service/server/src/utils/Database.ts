import {DataSource} from 'typeorm'

import  dotenv from 'dotenv'
import { User } from '../user/user.model';
import { Room } from '../room/room.model';
import { RoomParticipant } from '../room/room.participant.model';
import { Message } from '../message/message.model';

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
    entities: [User, Room, RoomParticipant, Message],
    synchronize:true
})


export const initiateConnection = async () => {
  
  try {
      await PostgreSQLDatasource.initialize()
      console.log("Data Source has been initialized!")
    } catch (error) {
      console.error("Error during Data Source initialization", error)
  }

}

export default PostgreSQLDatasource;