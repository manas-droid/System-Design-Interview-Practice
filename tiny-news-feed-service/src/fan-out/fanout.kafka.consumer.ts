import {Kafka} from 'kafkajs';
import { KafkaConstants } from '../utils/kafka.const';


const kafka = new Kafka({
    clientId: 'fan-out-service',
    brokers: [KafkaConstants.KAFKA_BROKER_URL] 
})


const kafkaConsumer = kafka.consumer({
    groupId : KafkaConstants.KAFKA_CONSUMER_GROUP_ID
});



export const initFanOutServiceConsumer = async ()=>{
    await kafkaConsumer.connect();
    await kafkaConsumer.subscribe({ topic: KafkaConstants.NEW_POST_TOPIC, fromBeginning: true });

    await kafkaConsumer.run({
        eachMessage : async ({topic,message, partition})=>{
            console.log("Topic", topic);
            console.log("key", message.key?.toString());
            console.log("value", message.value?.toString());
            console.log("value json", message.value?.toJSON());
            console.log("Partition", partition);
        }
    });

}


export const shutDownFanOutServiceConsumer = async ()=>{
    await kafkaConsumer.disconnect();
}

