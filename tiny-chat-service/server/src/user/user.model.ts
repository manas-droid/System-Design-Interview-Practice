import {Entity, PrimaryGeneratedColumn, Column, Check, OneToMany} from 'typeorm'
import { RoomParticipant } from '../room/room.participant.model';
import { Message } from "../message/message.model";



@Entity({name:"user_details"})
export class User {

    @PrimaryGeneratedColumn("uuid")
    id !: string

    @Column({ unique:true })
    email!:string

    @Column({name:'name'})
    userName!:string

    @OneToMany(() => RoomParticipant, (membership) => membership.participant)
    roomMemberships!: Array<RoomParticipant>;

    @OneToMany(() => Message, (message) => message.owner)
    messages!: Array<Message>;

}
