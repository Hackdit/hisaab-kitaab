export declare function sendTextMessage(to: string, text: string): Promise<void>;
export declare function sendDocument(to: string, mediaUrl: string, body?: string): Promise<void>;
export declare function sendInteractiveButtons(to: string, body: string, buttons: string[]): Promise<void>;
