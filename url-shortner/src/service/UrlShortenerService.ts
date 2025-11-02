import { SqliteUrlRepository } from "../urls/url.repository";

export interface IUrlShortenerService {
    generateShortenCode(): Promise<string>;
}


class UrlShortenerService implements IUrlShortenerService {
    private readonly BASE62_ALPHABET:string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    private readonly KEY_LENGTH:number = 7; // 62^6 provides over 56 billion keys

    private readonly attemptsLimit:number = 15;

    private readonly urlModel: SqliteUrlRepository = new SqliteUrlRepository();

    private generateRandomKey(): string {
        let key = '';
        for (let i = 0; i < this.KEY_LENGTH; i++) {
            const randomIndex = Math.floor(Math.random() * this.BASE62_ALPHABET.length);
            key += this.BASE62_ALPHABET.charAt(randomIndex);
        }
        return key;
    }

    public async generateShortenCode(): Promise<string> {
        let limit:number = 0;

        while (limit < this.attemptsLimit) {
            const shortCode : string = this.generateRandomKey();
            const exists: boolean = await this.checkIfShortCodeExists(shortCode);
            if(!exists){
                return shortCode;
            }

            else{
                limit++;
            }

        }

        throw new Error("Failed to generate a unique short key after multiple attempts. Try again later.");    
    }


    private async checkIfShortCodeExists(shortCode: string): Promise<boolean> {

        return await this.urlModel.checkIfShortCodeExists(shortCode);
    }

}

export default UrlShortenerService;