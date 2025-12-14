import {Kafka} from 'kafkajs';
import { KafkaConstants } from '../utils/kafka.const';
import { PostResponse } from '../post/post.service';
import { stringToPostConsumerResponse } from '../utils/kafka.value.mapper';
import { FanOutService, IFanOutService } from './fanout.service';


const kafka = new Kafka({
    clientId: 'fan-out-service',
    brokers: [KafkaConstants.KAFKA_BROKER_URL] 
})


const kafkaConsumer = kafka.consumer({
    groupId : KafkaConstants.KAFKA_CONSUMER_GROUP_ID
});


const fanOutService:IFanOutService = new FanOutService();

export const initFanOutServiceConsumer = async ()=>{
    await kafkaConsumer.connect();
    await kafkaConsumer.subscribe({ topic: KafkaConstants.NEW_POST_TOPIC, fromBeginning: true });

    await kafkaConsumer.run({
        eachMessage : async ({message})=>{

            console.log("key", message.key?.toString());

            const stringValue = message.value?.toString();

            if(stringValue){
                const postResponse:PostResponse = stringToPostConsumerResponse(stringValue);  

                await fanOutService.publishPostByUser(postResponse);
            }
            
            else console.error("Fan-out Kafka Consumer : Value does exist");

        }
    });

}


export const shutDownFanOutServiceConsumer = async ()=>{
    await kafkaConsumer.disconnect();
}

