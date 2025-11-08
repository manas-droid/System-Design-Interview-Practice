import {Request, Response} from 'express';
import { InMemoryWebhookRepository, IWebhookRepository, WebHookSubscriber } from './webhook.repository';

interface WebHookRequest{
    webHookUrl:string,
    eventType:string
}

const webHookRegistry:IWebhookRepository = new InMemoryWebhookRepository()

export async function registryController(req:Request, res:Response){
    const webHookRequest:WebHookRequest = req.body;
    const webHookSubscriber:WebHookSubscriber = {
         webHookUrl : webHookRequest.webHookUrl,
         eventType : webHookRequest.eventType,
         dateTimeStamp: Date.now()
    }

   try{
        await webHookRegistry.addToRepo(webHookSubscriber);
        res.status(200).json({ "message":"Webhook Registered" });
   } catch(error){
        res.status(500).json({"message": "Webhook registeration failed!"});
   }

}

