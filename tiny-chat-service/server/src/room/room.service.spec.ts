import 'reflect-metadata';
import { strict as assert } from 'assert';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { DataSource } from 'typeorm';
import { PSQLRoomService } from './room.service';
import { Room } from './room.model';
import { RoomParticipant } from './room.participant.model';
import { User } from '../user/user.model';
import { Message } from '../message/message.model';

let dataSource: DataSource | null = null;
const tempDbPath = path.join(process.cwd(), `room_service_test_${randomUUID().replace(/-/g, '')}.sqlite`);

async function initializeDataSource(): Promise<void> {
    dataSource = new DataSource({
        type: 'sqlite',
        database: tempDbPath,
        entities: [User, Room, RoomParticipant, Message],
        synchronize: true
    });

    await dataSource.initialize();
}

async function seedUser(suffix: string): Promise<User> {
    if (!dataSource) {
        throw new Error('Data source not initialized');
    }

    const userRepository = dataSource.getRepository(User);
    const user = userRepository.create({
        email: `test_user_${suffix}@example.com`,
        userName: `test_user_${suffix}`
    });

    return userRepository.save(user);
}

async function clearDatabase(): Promise<void> {
    if (!dataSource) {
        throw new Error('Data source not initialized');
    }

    await dataSource.getRepository(Message).clear();
    await dataSource.getRepository(RoomParticipant).clear();
    await dataSource.getRepository(Room).clear();
    await dataSource.getRepository(User).clear();
}

async function testGetOrCreateDirectRoomCreatesOnlyOneRoom(): Promise<void> {
    if (!dataSource) {
        throw new Error('Data source not initialized');
    }

    await clearDatabase();

    const roomService = new PSQLRoomService(dataSource);
    const [initiator, target] = await Promise.all([seedUser('initiator'), seedUser('target')]);

    const room = await roomService.getOrCreateDirectRoom(initiator.id, target.id);
    assert.ok(room, 'Room should be returned');
    assert.ok(room.id, 'Room must contain an id');

    const persistedRoom = await dataSource.getRepository(Room).findOne({
        where: { id: room.id },
        relations: ['participants']
    });

    assert.ok(persistedRoom, 'Room should be persisted');
    assert.equal(persistedRoom?.participants.length, 2, 'Room should have two participants');
    const participantIds = persistedRoom?.participants.map((participant) => participant.participantId).sort();
    const expectedIds = [initiator.id, target.id].sort();
    assert.deepEqual(participantIds, expectedIds, 'Room participants should match input users');

    const repeatedRoom = await roomService.getOrCreateDirectRoom(target.id, initiator.id);
    assert.equal(repeatedRoom.id, room.id, 'Subsequent calls should return the same room');
}

async function testGetRoomsForUserReturnsPeerNames(): Promise<void> {
    if (!dataSource) {
        throw new Error('Data source not initialized');
    }

    await clearDatabase();

    const roomService = new PSQLRoomService(dataSource);
    const [userA, userB, userC] = await Promise.all([
        seedUser('user_a'),
        seedUser('user_b'),
        seedUser('user_c')
    ]);

    const roomOne = await roomService.getOrCreateDirectRoom(userA.id, userB.id);
    const roomTwo = await roomService.getOrCreateDirectRoom(userA.id, userC.id);

    const rooms = await roomService.getRoomsForUser(userA.id);
    console.log(rooms);
    assert.equal(rooms.length, 2, 'User A should see two rooms');

    const responseMap = new Map(rooms.map((room) => [room.roomId, room.roomTitle]));
    assert.ok(responseMap.has(roomOne.id), 'First room id should be present in response');
    assert.ok(responseMap.has(roomTwo.id), 'Second room id should be present in response');
    assert.equal(responseMap.get(roomOne.id), userB.userName, 'Room title should match other participant');
    assert.equal(responseMap.get(roomTwo.id), userC.userName, 'Room title should match other participant');
}

async function run(): Promise<void> {
    try {
        await initializeDataSource();
        await testGetOrCreateDirectRoomCreatesOnlyOneRoom();
        await testGetRoomsForUserReturnsPeerNames();
        console.log('✓ getOrCreateDirectRoom persists and reuses direct rooms');
        console.log('✓ getRoomsForUser returns peer display names');
    } catch (error) {
        console.error('Room service tests failed:', error);
        process.exitCode = 1;
    } finally {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
        try {
            await fs.unlink(tempDbPath);
        } catch {
            // ignore missing db file
        }
    }
}

run();
