import { GoogleGenerativeAI } from "@google/generative-ai";
import { quotaManager } from "./quota-manager";

// Access your API key as an environment variable
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateReadme = async (repoContent: string): Promise<string> => {
  const maxRetries = 3;
  const baseDelay = 5000; // 5 second base delay for rate limits
  
  // Use the newer models, prioritizing Gemini 3 Flash Preview (like your Python example)
  const availableModels = [
    "gemini-3-flash-preview",  // Latest model from your Python example
    "gemini-2.5-flash",        // Stable fallback
    "gemini-2.5-pro"           // More powerful fallback
  ].filter(model => quotaManager.canUseModel(model));
  
  if (availableModels.length === 0) {
    throw new Error('Daily quota exceeded for all available models. Please try again tomorrow or upgrade to a paid plan.');
  }
  
  for (const modelName of availableModels) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Trying model: ${modelName}, attempt: ${attempt}`);
        
        // Use the newer model configuration approach
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 8192,
          }
        });

        const prompt = `Generate a comprehensive, professional README.md file for the following GitHub repository. 

Please include:
- Project title and description
- Installation instructions
- Usage examples
- Features list
- Technologies used
- Contributing guidelines
- License information

Repository content:
${repoContent}

Generate a well-structured README in markdown format:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Record successful usage
        quotaManager.recordUsage(modelName);
        console.log(`Successfully generated README with model: ${modelName}`);
        return text;
        
      } catch (error: any) {
        console.error(`Model ${modelName}, attempt ${attempt} failed:`, error);
        
        // Check if it's a rate limit error
        if (error?.message?.includes('429') || error?.message?.includes('RATE_LIMIT_EXCEEDED')) {
          if (attempt < maxRetries) {
            const delayTime = baseDelay * attempt;
            console.log(`Rate limited on ${modelName}. Retrying in ${delayTime / 1000} seconds...`);
            await delay(delayTime);
            continue;
          } else {
            console.log(`Rate limit exceeded for ${modelName}, trying next model...`);
            break; // Try next model
          }
        }
        
        // For other errors, try next model immediately
        console.log(`Error with ${modelName}, trying next model...`);
        break;
      }
    }
  }
  
  // If all models fail, throw error
  throw new Error('All Gemini models failed. Please check your API key and quota, or try again later.');
};