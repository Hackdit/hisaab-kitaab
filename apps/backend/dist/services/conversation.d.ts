export type OnboardingStep = 'start' | 'name' | 'gstin' | 'complete';
export interface WhatsAppState {
    step: OnboardingStep;
    businessName?: string;
    gstin?: string | null;
}
export declare const STATE_TTL: number;
export declare function initializeState(): WhatsAppState;
export declare function handleOnboarding(fromNumber: string, message: string, currentState: WhatsAppState | null): Promise<{
    state: WhatsAppState;
}>;
export declare function getState(fromNumber: string): Promise<WhatsAppState | null>;
export declare function saveState(fromNumber: string, state: WhatsAppState): Promise<void>;
