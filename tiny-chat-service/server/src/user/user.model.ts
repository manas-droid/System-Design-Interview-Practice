import {Entity, PrimaryGeneratedColumn, Column, Check} from 'typeorm'



@Entity({name:"user_details"})
export class User {

    @PrimaryGeneratedColumn("uuid")
    id !: string

    @Column({ unique:true })
    email!:string

    @Column({name:'name'})
    userName!:string
}
