import { Repository } from "typeorm";
import { IRoomService, PSQLRoomService } from "../room/room.service";
import { Message } from "./message.model";
import dB from '../utils/Database';


export interface IMessageService{

    addDirectMessage(ownerId:string, otherUserId:string,messageContent:string, roomId:(string|null)) : Promise<MessageResponse>;    
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

        console.log("ownerId: ",ownerId , "otherUserId: ", otherUserId, "messageContent: ", messageContent, "roomId: ", roomId);

        if(!roomId){
            roomId = (await this.roomService.getOrCreateDirectRoom(ownerId, otherUserId)).id; 
            console.log("Newly Created Room Id: ", roomId);
        }   



        const message = this.messageRepository.create({
            content : messageContent,
            ownerId: ownerId,
            roomId : roomId
        });



       const messageRepo: Message =  await this.messageRepository.save(message);


       return {
        content : messageContent, 
        roomId: messageRepo.roomId
       }
    }

}
