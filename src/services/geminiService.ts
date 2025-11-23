import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const queryJarvis = async (query: string, transactions: Transaction[], apiKey: string) => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Prepare context for the AI
  const transactionSummary = JSON.stringify(transactions.map(t => ({
    date: new Date(t.date).toLocaleDateString(),
    merchant: t.merchant,
    amount: t.amount,
    category: t.category,
    type: t.type
  })));

  const systemInstruction = `
    You are Jarvis, a personal financial assistant for an expense tracker app.
    You have access to the user's transaction history provided below as JSON.
    
    User's Transactions:
    ${transactionSummary}
    
    Rules:
    1. Answer questions about spending, budgets, and trends based ONLY on the provided data.
    2. Be concise, helpful, and encouraging.
    3. If the user asks about a specific category or merchant, calculate the totals accurately.
    4. Suggest insights if you see unusual spending (e.g., "You spent 50% of your budget on Coffee").
    5. Format currency in INR (₹).
    6. Keep responses short and conversational (under 100 words unless detailed analysis is asked).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to my brain servers right now. Please try again later.";
  }
};