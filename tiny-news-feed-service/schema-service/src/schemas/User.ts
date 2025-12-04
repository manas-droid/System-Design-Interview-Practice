import { Check, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Post } from "./Post";
import { Follower } from "./Follower";



@Entity()
@Check(`LENGTH("handle") >= 5`)
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!:string

    @Column({
        unique:true
    })
    email!:string

    @Column({
        type:"varchar"
    })

    firstName!:string

    @Column({
        type:"varchar"
    })

    lastName!:string


    // user name on the application
    @Column({
        unique:true,
        type:"varchar",
        length:50
    })
    handle!:string

    @Column({ select: false }) passwordHash!: string;

    @Column({ type: "varchar", nullable: true }) 
    profilePictureUrl?: string;

    @CreateDateColumn({type:'timestamptz'})
    createdAt!:Date


    @OneToMany(() => Post, (post) => post.user)
    posts!:Post[]


    @RelationId((user: User) => user.posts)
    postIds!:string[]


    @OneToMany(() => Follower, (record) => record.followee)
    followers!:Follower[]


    @RelationId((user: User) => user.followers)
    followerRecordIds!:string[]


    @OneToMany(() => Follower, (record) => record.follower)
    following!:Follower[]


    @RelationId((user: User) => user.following)
    followingRecordIds!:string[]
}
