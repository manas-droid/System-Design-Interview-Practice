import 'reflect-metadata';
import bcrypt from 'bcrypt';
import PostgreSQLDatasource, { ensureSchemaExists } from '../utils/database';
import { User } from '../schemas/User';
import { Follower } from '../schemas/Follower';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const TOTAL_USERS = 2500;
const HOT_USER_COUNT = 5;
const HOT_USER_THRESHOLD = 1000;
const NORMAL_FOLLOW_MIN = 25;
const NORMAL_FOLLOW_MAX = 150;
const PASSWORD_SALT_ROUNDS = 12;
const PASSWORD_HASH_BATCH_SIZE = 50;
const DEFAULT_PASSWORD = 'NewsfeedPass123!';

const FIRST_NAMES = [
  'Ava',
  'Liam',
  'Noah',
  'Maya',
  'Eli',
  'Sofia',
  'Isla',
  'Logan',
  'Mila',
  'Caleb',
  'Hazel',
  'Ivy',
  'Jonah',
  'Layla',
  'Nora',
  'Owen',
  'Piper',
  'Rhea',
  'Silas',
  'Theo',
  'Uma',
  'Vera',
  'Willow',
  'Xander',
  'Yara',
  'Zane',
];

const LAST_NAMES = [
  'Anderson',
  'Bennett',
  'Carter',
  'Diaz',
  'Ellis',
  'Foster',
  'Garcia',
  'Hart',
  'Irving',
  'Jacobs',
  'Keller',
  'Lopez',
  'Mason',
  'Nguyen',
  'Owens',
  'Patel',
  'Quinn',
  'Reed',
  'Santos',
  'Turner',
  'Usher',
  'Vargas',
  'Walker',
  'Xu',
  'Young',
  'Zimmerman',
];

const randomBetween = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomElement = <T>(values: T[]): T => {
  return values[randomBetween(0, values.length - 1)];
};

const sanitizeHandle = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const handleUsage = new Map<string, number>();

const buildHandle = (firstName: string, lastName: string) => {
  const baseHandle = `${sanitizeHandle(firstName)}.${sanitizeHandle(lastName)}`;
  const usage = handleUsage.get(baseHandle) ?? 0;
  handleUsage.set(baseHandle, usage + 1);

  if (usage === 0) {
    return baseHandle;
  }

  return `${baseHandle}${usage + 1}`;
};

const createUsers = async () => {
  const userRepository = PostgreSQLDatasource.getRepository(User);
const pendingUsers: {
    index: number;
    email: string;
    firstName: string;
    lastName: string;
    handle: string;
    passwordHash?: string;
  }[] = [];
  const hashJobs: Promise<void>[] = [];

  for (let i = 0; i < TOTAL_USERS; i += 1) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const handle = buildHandle(firstName, lastName);
    const emailLocalPart = handle.replace(/\./g, '_');

    const pendingUser : {
    index: number;
    email: string;
    firstName: string;
    lastName: string;
    handle: string;
    passwordHash?: string;
  } = {
      index: i,
      email: `${emailLocalPart}${i}@newsfeed.dev`,
      firstName,
      lastName,
      handle,
    };

    const hashJob = bcrypt.hash(DEFAULT_PASSWORD, PASSWORD_SALT_ROUNDS).then((passwordHash) => {
      pendingUser.passwordHash = passwordHash;
    });

    pendingUsers.push(pendingUser);
    hashJobs.push(hashJob);

    if (hashJobs.length >= PASSWORD_HASH_BATCH_SIZE) {
      await Promise.all(hashJobs);
      hashJobs.length = 0;
    }
  }

  if (hashJobs.length) {
    await Promise.all(hashJobs);
  }

  const userBatch = pendingUsers
    .sort((a, b) => a.index - b.index)
    .map((payload) =>
      userRepository.create({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        handle: payload.handle,
        passwordHash: payload.passwordHash!,
      }),
    );

  return userRepository.save(userBatch, { chunk: 500 });
};

const seedFollowerGraph = async (users: User[]) => {
  if (users.length <= HOT_USER_COUNT) {
    throw new Error('Not enough users to designate hot accounts');
  }

  const followerRepository = PostgreSQLDatasource.getRepository(Follower);
  const hotUsers = users.slice(0, HOT_USER_COUNT);
  const nonHotUsers = users.slice(HOT_USER_COUNT);

  const followerPairs = new Set<string>();
  const followerRecords: Follower[] = [];
  const followerCounts = new Map<string, number>();

  const addRelation = (follower: User, followee: User) => {
    if (follower.id === followee.id) {
      return;
    }

    const key = `${follower.id}:${followee.id}`;

    if (followerPairs.has(key)) {
      return;
    }

    followerPairs.add(key);
    followerRecords.push(
      followerRepository.create({
        follower,
        followee,
      }),
    );
    followerCounts.set(followee.id, (followerCounts.get(followee.id) ?? 0) + 1);
  };

  nonHotUsers.forEach((user) => {
    hotUsers.forEach((hotUser) => {
      if ((followerCounts.get(hotUser.id) ?? 0) >= HOT_USER_THRESHOLD) {
        return;
      }

      addRelation(user, hotUser);
    });
  });

  nonHotUsers.forEach((user) => {
    const followCount = randomBetween(NORMAL_FOLLOW_MIN, NORMAL_FOLLOW_MAX);

    for (let i = 0; i < followCount; i += 1) {
      const followee = users[randomBetween(0, users.length - 1)];
      addRelation(user, followee);
    }
  });

  hotUsers.forEach((hotUser) => {
    const followCount = randomBetween(50, 200);

    for (let i = 0; i < followCount; i += 1) {
      const followee = nonHotUsers[randomBetween(0, nonHotUsers.length - 1)];
      addRelation(hotUser, followee);
    }
  });

  await followerRepository.save(followerRecords, { chunk: 1000 });

  hotUsers.forEach((hotUser) => {
    const totalFollowers = followerCounts.get(hotUser.id) ?? 0;
    console.log(`Hot user ${hotUser.handle} now has ${totalFollowers} followers.`);
  });

  console.log(`Inserted ${followerRecords.length} follower relationships.`);
};

const resetTables = async () => {
  const options = (PostgreSQLDatasource.options as PostgresConnectionOptions);

  const schema = ( options['schema'] as string) || 'public';
  const qualify = (table: string) => `"${schema}"."${table}"`;

  const queryRunner = PostgreSQLDatasource.createQueryRunner();
  try {
    await queryRunner.connect();
    await queryRunner.query(
      `TRUNCATE TABLE ${[
        qualify('post'),
        qualify('follower'),
        qualify('user'),
      ].join(', ')} RESTART IDENTITY CASCADE`,
    );
  } finally {
    await queryRunner.release();
  }
};

const main = async () => {
  if (!PostgreSQLDatasource.isInitialized) {
    await ensureSchemaExists();
    await PostgreSQLDatasource.initialize();
    console.log("Options",PostgreSQLDatasource.options);
  }

  
  
  await resetTables();

  const users = await createUsers();
  await seedFollowerGraph(users);

  console.log(`Seeded ${users.length} users.`);
  console.log(`Default password for all users: ${DEFAULT_PASSWORD}`);
};

main()
  .catch((error) => {
    console.error('Failed to seed dummy users/followers', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (PostgreSQLDatasource.isInitialized) {
      await PostgreSQLDatasource.destroy();
    }
  });
