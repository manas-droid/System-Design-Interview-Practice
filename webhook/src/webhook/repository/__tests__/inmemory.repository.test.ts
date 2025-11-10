import {InMemoryWebhookRepository, WebHookSubscriber} from '../webhook.inmemory.repository'

describe("In memory Web Hook Respository Test",  ()=>{
    let repository: InMemoryWebhookRepository;
    
    beforeEach(() => {
        repository = new InMemoryWebhookRepository();
    });

    describe('addToRepo', () => {
        it('should add webhook subscriber and return true', async () => {
            const subscriber: WebHookSubscriber = {
                webHookUrl: 'https://example.com/webhook',
                eventType: 'user.created',
                dateTimeStamp: Date.now()
            };

            const result = await repository.addToRepo(subscriber);
            expect(result).toBe(true);
        });
    });

    describe('getSubscribersByEventType', () => {
        it('should return empty array when no subscribers exist', async () => {
            const result = await repository.getSubscribersByEventType('user.created');
            expect(result).toEqual([]);
        });

        it('should return subscribers for matching event type', async () => {
            const subscriber1: WebHookSubscriber = {
                webHookUrl: 'https://example1.com/webhook',
                eventType: 'user.created',
                dateTimeStamp: Date.now()
            };
            const subscriber2: WebHookSubscriber = {
                webHookUrl: 'https://example2.com/webhook',
                eventType: 'user.created',
                dateTimeStamp: Date.now()
            };

            await repository.addToRepo(subscriber1);
            await repository.addToRepo(subscriber2);

            const result = await repository.getSubscribersByEventType('user.created');
            expect(result).toHaveLength(2);
            expect(result).toContain(subscriber1);
            expect(result).toContain(subscriber2);
        });

        it('should filter subscribers by event type', async () => {
            const subscriber1: WebHookSubscriber = {
                webHookUrl: 'https://example1.com/webhook',
                eventType: 'user.created',
                dateTimeStamp: Date.now()
            };
            const subscriber2: WebHookSubscriber = {
                webHookUrl: 'https://example2.com/webhook',
                eventType: 'user.deleted',
                dateTimeStamp: Date.now()
            };

            await repository.addToRepo(subscriber1);
            await repository.addToRepo(subscriber2);

            const result = await repository.getSubscribersByEventType('user.created');
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(subscriber1);
        });
    });
});