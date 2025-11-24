import { GoogleGenerativeAI } from '@google/generative-ai';

interface CategorizationRequest {
    merchant: string;
    amount: number;
    smsBody: string;
    availableCategories: string[];
}

interface BatchItem {
    id: string;
    merchant: string;
    amount: number;
    smsBody: string;
}

export class GeminiCategorizationService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async categorizeTransaction(request: CategorizationRequest): Promise<string | null> {
        try {
            const prompt = `
            You are an expert financial transaction categorizer.
            Analyze the following transaction and assign it to one of the available categories.
            
            Transaction Details:
            - Merchant: ${request.merchant}
            - Amount: ${request.amount}
            - SMS Body: "${request.smsBody}"
            
            Available Categories:
            ${request.availableCategories.join(', ')}
            
            Rules:
            1. Return ONLY the exact category name from the list above.
            2. If you are unsure, return "Other".
            3. Do not include any explanation or extra text.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            // Validate that the response is one of the available categories
            if (request.availableCategories.includes(text)) {
                return text;
            }

            return 'Other';
        } catch (error) {
            console.error('Gemini categorization failed:', error);
            return null;
        }
    }

    async categorizeBatch(items: BatchItem[], availableCategories: string[]): Promise<Record<string, string>> {
        try {
            const prompt = `
            You are an expert financial transaction categorizer.
            Analyze the following list of transactions and assign each to one of the available categories.

            Available Categories:
            ${availableCategories.join(', ')}

            Transactions:
            ${JSON.stringify(items.map(i => ({ id: i.id, merchant: i.merchant, amount: i.amount, body: i.smsBody })))}

            Rules:
            1. Return a JSON object where keys are transaction IDs and values are the assigned category names.
            2. Use ONLY the categories provided above.
            3. If unsure, use "Other".
            4. Return ONLY the JSON object, no markdown formatting or extra text.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            // Clean up markdown code blocks if present
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const categorized = JSON.parse(text);
            return categorized;
        } catch (error) {
            console.error('Gemini batch categorization failed:', error);
            return {};
        }
    }
}
