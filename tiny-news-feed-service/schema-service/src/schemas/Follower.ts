import { Check, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, Unique } from "typeorm";
import { User } from "./User";


@Entity()
@Unique(["follower", "followee"])
@Check(`"followerId" <> "followeeId"`)
export class Follower {
    @PrimaryGeneratedColumn("uuid")
    id!:string


    @ManyToOne(() => User, (user) => user.following, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "followerId" })
    follower!:User


    @RelationId((record: Follower) => record.follower)
    followerId!:string


    @ManyToOne(() => User, (user) => user.followers, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "followeeId" })
    followee!:User


    @RelationId((record: Follower) => record.followee)
    followeeId!:string


    @CreateDateColumn({type:"timestamptz"})
    createdAt!:Date
}
