import dB from '../../utils/Database'
import { User } from '../user.model';
import { generateUsernameFromEmail } from '../user.service';


export type DummyUserSeed = {
    name?: string;
    email: string;
}

const userRepository = dB.getRepository(User);


const DEFAULT_DUMMY_USERS: DummyUserSeed[] = [
    { name: 'Ava Carter', email: 'ava.carter@example.com' },
    { name: 'Nolan Patel', email: 'nolan.patel@example.com' },
    { name: 'Lena Ortiz', email: 'lena.ortiz@example.net' },
    { name: 'Maya Chen', email: 'maya.chen@example.org' },
    { name: 'Theo Hughes', email: 'theo.hughes@example.com' },
    { name: 'Priya Desai', email: 'priya.desai@example.net' },
    { name: 'Elias Ford', email: 'elias.ford@example.org' },
    { name: 'Hazel Rivers', email: 'hazel.rivers@example.com' },
    { name: 'Camila Grant', email: 'camila.grant@example.net' },
    { name: 'Luca Moretti', email: 'luca.moretti@example.org' },
    { name: 'Yara Haddad', email: 'yara.haddad@example.com' },
    { name: 'Owen Brooks', email: 'owen.brooks@example.net' }
]

export async function addDummyUsers(dummyUsers: Array<DummyUserSeed> = DEFAULT_DUMMY_USERS): Promise<void> {
    if(!dummyUsers || dummyUsers.length === 0) return;

        const normalizedSeeds = dummyUsers
            .map((seed) => {
                const email = seed.email?.trim().toLowerCase();
                if(!email) return null;
                const name = seed.name?.trim() || generateUsernameFromEmail(email);
                return {email, userName: name};
            })
            .filter((seed): seed is {email:string; userName:string} => Boolean(seed));


        if(normalizedSeeds.length === 0) return;

        const uniqueSeedMap = new Map<string, {email:string; userName:string}>();
        normalizedSeeds.forEach((seed) => {
            if(!uniqueSeedMap.has(seed.email)){
                uniqueSeedMap.set(seed.email, seed);
            }
        });

        const dedupedSeeds = Array.from(uniqueSeedMap.values());
        if(dedupedSeeds.length === 0) return;

        const existingUsers = await userRepository.find({
            where: dedupedSeeds.map((seed) => ({email: seed.email}))
        })

        const existingEmails = new Set(existingUsers.map((user) => user.email.toLowerCase()));

        const newUsers = dedupedSeeds
            .filter((seed) => !existingEmails.has(seed.email))
            .map((seed) => {
                const user = new User();
                user.email = seed.email;
                user.userName = seed.userName;
                return user;
            });

        
        if(newUsers.length === 0) return;

        const savedUsers = await userRepository.save(newUsers);    

        console.log("Created Dummy Users successfully!" , savedUsers);
    }

