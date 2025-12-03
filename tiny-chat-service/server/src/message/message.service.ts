import { Repository } from "typeorm";
import { IRoomService, PSQLRoomService } from "../room/room.service";
import { Message } from "./message.model";
import dB from '../utils/Database';
import { UserSearchResponse } from "../user/user.response";
import { User } from "../user/user.model";
import { Room } from "../room/room.model";
import { RoomParticipant } from "../room/room.participant.model";



export interface MessagePerRoomResponse {
    message : string, 
    messageOwner:UserSearchResponse,
    createdAt:Date
}

export interface MessageDeliveryResponse extends MessagePerRoomResponse {
    id: string;
    roomId: string;
}

export interface RoomDeliveryResponse {
    id: string;
    title: string;
    participants: UserSearchResponse[];
}

export interface DirectMessageResult {
    message: MessageDeliveryResponse;
    room: RoomDeliveryResponse | null;
    isNewRoom: boolean;
}

export interface IMessageService{

    addDirectMessage(ownerId:string, otherUserId:string,messageContent:string, roomId:(string|null)) : Promise<DirectMessageResult>;    
    getMessagesForUserWithRoomID(roomId:string): Promise<MessagePerRoomResponse[]>
}





export class PSQLMessageService implements IMessageService {
    private readonly roomService:IRoomService;
    private readonly messageRepository : Repository<Message>;
    private readonly roomRepository: Repository<Room>;

    constructor(){
        this.roomService = new PSQLRoomService();
        this.messageRepository  = dB.getRepository(Message);
        this.roomRepository = dB.getRepository(Room);
    }

    async addDirectMessage(ownerId: string,otherUserId:string,messageContent: string, roomId: (string | null)): Promise<DirectMessageResult> {

        const wasExistingRoom = Boolean(roomId);
        let roomDetails: Room | null = null;

        if(!roomId){
            roomDetails = await this.roomService.getOrCreateDirectRoom(ownerId, otherUserId);
            roomId = roomDetails.id; 
        }   

        const message = this.messageRepository.create({
            content: messageContent,
            owner: { id: ownerId } as User,
            room: { id: roomId } as Room
        });

        const savedMessage: Message =  await this.messageRepository.save(message);

        const hydratedMessage = await this.messageRepository.findOne({
            where: { id: savedMessage.id },
            relations: { owner: true, room: true }
       });

        if(!hydratedMessage){
            throw new Error("Failed to load the saved message");
        }

        roomDetails = await this.roomRepository.findOne({
            where: { id: roomId },
            relations: { participants: { participant: true } }
        });

        const participants: UserSearchResponse[] = (roomDetails?.participants || []).map((participant: RoomParticipant) => ({
            userId: participant.participant?.id || participant.participantId,
            userName: participant.participant?.userName || participant.participantId
        }));

        const titleFallback = participants.find((participant) => participant.userId !== ownerId)?.userName
            || participants[0]?.userName
            || '';

        const roomResponse: RoomDeliveryResponse | null = roomDetails ? {
            id: roomDetails.id,
            title: roomDetails.name || titleFallback,
            participants
        } : null;

        return {
            message: {
                id: hydratedMessage.id,
                roomId: hydratedMessage.roomId,
                message: hydratedMessage.content,
                createdAt: hydratedMessage.createdAt,
                messageOwner: {
                    userId: hydratedMessage.owner.id,
                    userName: hydratedMessage.owner.userName
                }
            },
            room: roomResponse,
            isNewRoom: !wasExistingRoom
        }
    }

    async getMessagesForUserWithRoomID(roomId: string): Promise<MessagePerRoomResponse[]> {
            
        const messageDetails:Message[] = await this.messageRepository
        .find({ where : { room: {
            id : roomId
        } }  , relations: {owner:true , room:true}, order: { createdAt: "ASC" } });

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
