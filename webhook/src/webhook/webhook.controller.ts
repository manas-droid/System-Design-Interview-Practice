import {Request, Response} from 'express';
import { InMemoryWebhookRepository, IWebhookRepository, WebHookSubscriber } from './repository/webhook.inmemory.repository';

interface WebHookRegistryRequest{
    webHookUrl:string,
    eventType:string
}

const webHookService:IWebhookRepository = new InMemoryWebhookRepository()

export async function registryController(req:Request, res:Response){
    const webHookRequest:WebHookRegistryRequest = req.body;
    const webHookSubscriber:WebHookSubscriber = {
         webHookUrl : webHookRequest.webHookUrl,
         eventType : webHookRequest.eventType,
         dateTimeStamp: Date.now()
    }

   try{
        await webHookService.addToRepo(webHookSubscriber);
        res.status(200).json({ "message":"Webhook Registered" });
   } catch(error){
        res.status(500).json({"message": "Webhook registeration failed!"});
   }

}

interface WebHookTriggerRequest {
     eventType:string,
     payload : any
}


export async function triggerController(req:Request, res:Response){
     const triggerPayload: WebHookTriggerRequest = req.body;
     const subcribers : WebHookSubscriber[] = await webHookService.getSubscribersByEventType(triggerPayload.eventType);
     subcribers.forEach(async (sub: WebHookSubscriber)=>{
          const response = await fetch(sub.webHookUrl, { method: "POST", body: triggerPayload.payload });
          if(!response.ok){
               throw new Error(`Something went wrong while triggering a callback : ${sub.webHookUrl} and status: ${response.status}`);
          }

          console.log(`Callback URL: ${sub.webHookUrl} triggered with response : ${response.status}`);
     });


     res.status(202).json({"message": "Webhook Triggered to " + subcribers.length + " subscribers" });
}