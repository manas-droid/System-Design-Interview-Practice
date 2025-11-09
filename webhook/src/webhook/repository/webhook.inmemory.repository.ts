export interface IWebhookRepository {
    addToRepo(webHookModel: WebHookSubscriber):Promise<boolean>
    getSubscribersByEventType(eventType:string):Promise<WebHookSubscriber[]>
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

    getSubscribersByEventType(eventType: string): Promise<WebHookSubscriber[]> {
        
        return new Promise((resolve, __)=>{
            const filteredSubscribers = this.memoryDB.filter(subscriber => subscriber.eventType === eventType);
            resolve(filteredSubscribers);
        });
    }

}