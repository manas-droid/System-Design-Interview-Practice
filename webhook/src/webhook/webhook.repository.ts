export interface IWebhookRepository {
    addToRepo(webHookModel: WebHookSubscriber):Promise<boolean>
}

export interface WebHookSubscriber{
    webHookUrl:string,
    eventType:string,
    dateTimeStamp:number
}


export class InMemoryWebhookRepository implements IWebhookRepository {
    private readonly memoryDB : WebHookSubscriber[];

    constructor(){
        this.memoryDB = [];
    }

    addToRepo(webHookModel: WebHookSubscriber): Promise<boolean> {
        console.log(`Webhook URL ${webHookModel.webHookUrl} added to in-memory repository.`);
        this.memoryDB.push(webHookModel);
        return new Promise((resolve, __)=>resolve(true));
    }
}