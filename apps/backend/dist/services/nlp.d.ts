export interface NlpResult {
    intent: string;
    entities: Record<string, any>;
    confidence: number;
    response: string;
}
/**
 * Process natural language input through the NLP pipeline.
 * Delegates to the @hisab-kitaab/nlp package.
 */
export declare function processNlp(params: {
    text: string;
    state: any;
    business_context: {
        id: string;
        name: string;
        gstin: string | null;
    };
}): Promise<NlpResult>;
