import {Kafka} from 'kafkajs';
import { PostResponse } from './post.service';
import { KafkaConstants } from '../utils/kafka.const';


const kafka = new Kafka({
    clientId: 'post-service',
    brokers:[KafkaConstants.KAFKA_BROKER_URL]
});


const producer = kafka.producer();

export const initPostServiceKafkaProducer = async ()=>{
    await producer.connect();
}


export const shutDownPostServiceProducer = async () =>{
    await producer.disconnect();
}

export const pushPostDetailsToBroker = async (postResponse : PostResponse) => {
    await producer.send({
        topic: KafkaConstants.NEW_POST_TOPIC,
        messages : [{
            key : postResponse.id, 
            value: JSON.stringify(postResponse)
        }]
    });
}