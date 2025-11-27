import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    RelationId
} from "typeorm";
import { Room } from "../room/room.model";
import { User } from "../user/user.model";


@Entity({name: "messages"})
export class Message{

    @PrimaryGeneratedColumn("uuid")
    id !: string

    @ManyToOne(() => Room, (room) => room.messages, {onDelete:"CASCADE"})
    @JoinColumn({name:"room_id"})
    room!: Room;

    @RelationId((message:Message) => message.room)
    roomId!: string;

    @ManyToOne(() => User, (user) => user.messages, {onDelete:"CASCADE"})
    @JoinColumn({name:"owner_id"})
    owner!: User;

    @RelationId((message:Message) => message.owner)
    ownerId!: string;

    @Column({type:"text"})
    content !: string

    @CreateDateColumn({name:"created_at"})
    createdAt !: Date

    @DeleteDateColumn({name:"deleted_at", nullable:true })
    deletedAt !: Date | null

    @ManyToOne(() => User, {nullable:true, onDelete:"SET NULL"})
    @JoinColumn({name:"deleted_by"})
    deletedByUser!: User | null;

    @RelationId((message:Message) => message.deletedByUser)
    deletedBy!: string

}
