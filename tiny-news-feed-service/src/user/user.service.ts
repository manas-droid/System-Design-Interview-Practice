import { Repository } from "typeorm";
import { User } from "../schemas/User";
import PostgreSQLDatasource from "../utils/database";

export interface IUserService {
    getUserIfExists(userId:string) : Promise<User|null>;
}



export class UserService implements IUserService {

    private readonly userRepository:Repository<User>;

    constructor(){
        this.userRepository = PostgreSQLDatasource.getRepository(User);
    }

    async getUserIfExists(userId: string): Promise<User|null> {

        return await this.userRepository.findOne({where : {id : userId}});
    }

}
