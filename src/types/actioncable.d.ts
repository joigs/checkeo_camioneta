declare module '@rails/actioncable' {
    export interface Subscription {
        unsubscribe(): void;
        perform(action: string, data: any): void;
    }

    export interface Subscriptions {
        create(channel: any, obj: any): Subscription;
    }

    export interface Consumer {
        subscriptions: Subscriptions;
        disconnect(): void;
    }

    export function createConsumer(url?: string): Consumer;
}