import {Entity, PrimaryGeneratedColumn, Column, Unique, Check} from 'typeorm'



@Entity({name: "chat_service_user"})
@Check(`"email" LIKE '%@%.'`)
export class User {

    @PrimaryGeneratedColumn("uuid")
    id !: string

    @Column({ unique:true })
    email!:string

    @Column({name:"user_name"})
    userName!:string
}
