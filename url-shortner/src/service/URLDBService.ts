
import { url } from "inspector";
import { UrlModel, UrlRecord } from "../database/models.interface";
import { IUrlShortenerService } from "./UrlShortenerService";

export interface IURLDBService {
    createShortenedURL(originalUrl: string): Promise<void>;
    getAllURLs(): Promise<UrlRecord[]>;
    getLongURL(shortCode: string, userAgent?:string): Promise<string>;
}



export class URLDBService implements IURLDBService {
    private shortenerService: IUrlShortenerService;
    private urlModel: UrlModel;

    constructor(shortenerService: IUrlShortenerService, urlModel: UrlModel) {
        this.shortenerService = shortenerService;
        this.urlModel = urlModel;
    }

    async createShortenedURL(originalUrl : string): Promise<void> {
        const shortCode: string = await this.shortenerService.generateShortenCode();
        try {
            await this.urlModel.create(shortCode, originalUrl);
        } catch (error) {
            throw new Error("Error creating shortened URL: " + (error as Error).message);            
        }
    }
    
    async getAllURLs(): Promise<UrlRecord[]> {
        // Implementation for getting all URLs
    
        return await this.urlModel.getAll();
    }

    async getLongURL(shortCode: string, userAgent: string): Promise<string> {
        try{
            return await this.urlModel.processClickTransaction(shortCode, userAgent);
        }catch(error){
            throw new Error("Error while getting Long URL: "+ (error as Error).message);
        }
    }


}
