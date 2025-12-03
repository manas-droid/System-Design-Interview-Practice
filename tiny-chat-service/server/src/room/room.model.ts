import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Message } from "../message/message.model";
import { RoomParticipant } from "./room.participant.model";


export enum RoomType{
    DIRECT = "direct",
    GROUP = "group"
}



@Entity({name: "rooms"})
export class Room{
    @PrimaryGeneratedColumn("uuid")
    id!:string;

    @Column({
        type:"simple-enum",
        enum:RoomType,
        default: RoomType.DIRECT
    })
    type!: RoomType

    @Column({
        nullable:true
    })
    name!: string

    @OneToMany(()=>RoomParticipant, (participant:RoomParticipant) => participant.room, {cascade:true})
    participants !: Array<RoomParticipant>

    @OneToMany(() => Message, (message) => message.room)
    messages!: Array<Message>
}
