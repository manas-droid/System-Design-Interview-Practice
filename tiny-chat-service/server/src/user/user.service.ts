import { User } from "./user.model";
import dB from '../utils/Database'
import { Repository } from "typeorm";
import { UserResponse, UserSearchResponse } from "./user.response";




export function generateUsernameFromEmail(email: string): string {
        const localPart = email.split('@')[0];
        const sanitizedLocalPart = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const username = `${sanitizedLocalPart}${randomSuffix}`;

        return username;
}




export interface IUserService{
    getUserDetailsIfExists(email:string) : Promise<UserResponse|null>;
    addNewUser(email:string) : Promise<UserResponse>;   
    getAllUsers() : Promise<Array<UserSearchResponse>>;
}


export class PSQLUserService implements IUserService {

    private readonly userRepository : Repository<User>;
    
    constructor(){
        this.userRepository = dB.getRepository(User);
    }
  

    async getUserDetailsIfExists(email: string): Promise<UserResponse|null> {
        const user:User|null = await this.userRepository.findOneBy({email});

        if(!user) return null;

        const userResponse : UserResponse = {
            userId : user.id,
            userName: user.userName,
            message: "Login Successful"
        }


        return userResponse;
    }
    
    async addNewUser(email: string): Promise<UserResponse> {

        const user:User = new User()
        user.email = email;
        user.userName = generateUsernameFromEmail(email);

        const insertedUser = await this.userRepository.insert(user);
        
        const userResponse:UserResponse = {
            userId: insertedUser.generatedMaps[0].id,
            userName: insertedUser.generatedMaps[0].userName,
            message : "Created User Successfully"
        }


        return userResponse;
    }


    async getAllUsers(): Promise<Array<UserSearchResponse>> {
        return (await this.userRepository.find())?.map((user) =>{
            return {
                userId : user.id,
                userName : user.userName
            }
        }) || [];
    }

}

