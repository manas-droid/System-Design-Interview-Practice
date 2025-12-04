import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { User } from "./User";



@Entity()
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id!:string


    @Column({type:'varchar'})
    content!:string


    @RelationId((post: Post) => post.user)
    userId!:string


    @ManyToOne(() => User, (user) => user.posts, { nullable: false })
    @JoinColumn({ name: "userId" })
    user!:User


    @CreateDateColumn({type:"timestamptz"})
    createdAt!:Date

    // whatever photo is relevant to the post
    @Column({ type: "varchar", nullable: true }) 
    photoURL?: string;
}
