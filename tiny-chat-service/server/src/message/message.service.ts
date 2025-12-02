import { Repository } from "typeorm";
import { IRoomService, PSQLRoomService } from "../room/room.service";
import { Message } from "./message.model";
import dB from '../utils/Database';
import { UserSearchResponse } from "../user/user.response";
import { User } from "../user/user.model";
import { Room } from "../room/room.model";



export interface MessagePerRoomResponse {
    message : string, 
    messageOwner:UserSearchResponse,
    createdAt:Date
}

export interface IMessageService{

    addDirectMessage(ownerId:string, otherUserId:string,messageContent:string, roomId:(string|null)) : Promise<MessageResponse>;    
    getMessagesForUserWithRoomID(roomId:string): Promise<MessagePerRoomResponse[]>
}


export interface MessageResponse {
    content : string, 
    roomId : string    
}





export class PSQLMessageService implements IMessageService {
    private readonly roomService:IRoomService;
    private readonly messageRepository : Repository<Message>;

    constructor(){
        this.roomService = new PSQLRoomService();
        this.messageRepository  = dB.getRepository(Message);
    }

    async addDirectMessage(ownerId: string,otherUserId:string,messageContent: string, roomId: (string | null)): Promise<MessageResponse> {


        if(!roomId){
            roomId = (await this.roomService.getOrCreateDirectRoom(ownerId, otherUserId)).id; 
        }   



        const message = this.messageRepository.create({
            content: messageContent,
            owner: { id: ownerId } as User,
            room: { id: roomId } as Room
        });



       const messageRepo: Message =  await this.messageRepository.save(message);


       return {
        content : messageContent, 
        roomId: messageRepo.roomId
       }
    }

    async getMessagesForUserWithRoomID(roomId: string): Promise<MessagePerRoomResponse[]> {
            
        const messageDetails:Message[] = await this.messageRepository
        .find({ where : { room: {
            id : roomId
        } }  , relations: {owner:true , room:true} });

        return messageDetails.map((m:Message)=>{

            return {
                message: m.content,
                createdAt: m.createdAt,
                messageOwner: {
                    userId: m.owner.id,
                    userName: m.owner.userName
                }
            }
        });

    }


}
