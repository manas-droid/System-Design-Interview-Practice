import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Room } from "./room.model";
import { User } from "../user/user.model";




export enum ParticipantRole{
    MEMBER = "member",
    ADMIN = "admin"
}

@Entity({name:"room_participants"})
@Unique(["roomId", "participantId"])
export class RoomParticipant{

    @PrimaryGeneratedColumn("uuid")
    id !: string

    @Column({
        name:"room_id"
    })
    roomId !: string 


    @Column({
        type:"simple-enum",
        enum:ParticipantRole,
        default:ParticipantRole.MEMBER
    })
    role!:ParticipantRole


    @Column({
        name:"participant_id"
    })
    participantId !: string



    @ManyToOne(()=>Room, (room:Room)=> room.participants, {onDelete: "CASCADE"})
    @JoinColumn({name: "room_id"})
    room!: Room

    @ManyToOne(()=>User, (user:User)=>user.roomMemberships, {onDelete:"CASCADE"})
    @JoinColumn({name:"participant_id"})
    participant!:User
}
