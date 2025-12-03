import { DataSource, Repository } from "typeorm";
import { Room, RoomType } from "./room.model";
import dB from '../utils/Database'
import { ParticipantRole, RoomParticipant } from "./room.participant.model";
import { UserSearchResponse } from "../user/user.response";

export interface RoomResponse {
    roomTitle : string;
    roomId: string;
    participants:UserSearchResponse[]
}


export interface IRoomService {

    getRoomsForUser(userId : string) : Promise<Array<RoomResponse>>
    getOrCreateDirectRoom(initiatorId: string, targetUserId: string): Promise<Room>
}





export class PSQLRoomService implements IRoomService {

    private readonly roomRepository: Repository<Room>
    private readonly roomParticipantRepository: Repository<RoomParticipant>
    private readonly dataSource: DataSource;

    constructor (dataSource: DataSource = dB){
        this.dataSource = dataSource;
        this.roomRepository = dataSource.getRepository(Room);
        this.roomParticipantRepository = dataSource.getRepository(RoomParticipant);

    }

    async getRoomsForUser(userId: string): Promise<Array<RoomResponse>> {
        const roomsForUser = await this.roomRepository
            .createQueryBuilder('room')
            .innerJoin('room.participants', 'membership', 'membership.participantId = :userId', { userId })
            .leftJoinAndSelect('room.participants', 'participants')
            .leftJoinAndSelect('participants.participant', 'participantUser')
            .distinct(true)
            .getMany();

        return roomsForUser.map((room: Room) => {
            if (room.type === RoomType.DIRECT) {
                const otherParticipant = room.participants.find((participant) => participant.participantId !== userId);
                room.name = otherParticipant?.participant?.userName || room.name;
            }

            return {
                roomTitle: room.name || "",
                roomId: room.id,
                participants: room.participants.map((participant)=>{ return {
                    userId: participant.participant.id,
                    userName: participant.participant.userName
                }})
            };
        });
    }

    async getOrCreateDirectRoom(initiatorId: string, targetUserId: string): Promise<Room> {
        if(initiatorId === targetUserId) {
            throw new Error("A direct room requires two different users");
        }

        const [firstUser, secondUser] = [initiatorId, targetUserId].sort();
        const existingRoom = await this.roomRepository
                                        .createQueryBuilder('room')
                                        .innerJoin('room.participants', 'participants')
                                        .where('room.type = :roomType', { roomType: RoomType.DIRECT })
                                        .groupBy('room.id')
                                        .having(
                                            `
                                            COUNT(DISTINCT participants.participantId) = 2
                                            AND COUNT(CASE WHEN participants.participantId = :firstUser THEN 1 END) = 1
                                            AND COUNT(CASE WHEN participants.participantId = :secondUser THEN 1 END) = 1
                                            `,
                                            { 
                                            firstUser: firstUser, 
                                            secondUser: secondUser 
                                            }
                                        )
                                        .getOne();

        if(existingRoom) {
            return existingRoom;
        }

        return await this.dataSource.transaction(async (manager) => {
            const roomRepository = manager.getRepository(Room);
            const roomParticipantRepository = manager.getRepository(RoomParticipant);

            const room = roomRepository.create({ type: RoomType.DIRECT, name: undefined });
            const savedRoom = await roomRepository.save(room);

            const participants = [initiatorId, targetUserId].map((participantId) =>
                roomParticipantRepository.create({
                room: savedRoom,
                participantId,
                role: ParticipantRole.MEMBER
                })
            );

            await roomParticipantRepository.save(participants);

            savedRoom.participants = participants;

            return savedRoom;
        });

    }
}
