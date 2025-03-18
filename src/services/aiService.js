import OpenAI from "openai";

import { GENRE_MAPPINGS } from "../utils/libraryCodeGenerator";

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY
});


export const analyzeMainGenre = async (isbn) => {
    try {
      // Create a prompt for ChatGPT to analyze the book's genre
      const prompt = `
        Given a book with ISBN ${isbn},
        determine the primary genre from this list: ${Object.keys(GENRE_MAPPINGS).join(', ')}.
        Return only the primary genre code as a single word or phrase, nothing else.
      `;

      console.log('openai :: ', openai.apiKey)
  
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", 
        messages: [
          {
            role: "system",
            content: "You are a helpful book classification assistant."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, 
        max_tokens: 10   
      });
      
      const mainGenre = completion.choices[0].message.content.trim();
  
      return GENRE_MAPPINGS[mainGenre] || 'GEN';
  
    } catch (error) {
      console.error('Error analyzing genre:', error);
      throw new Error('An error occurred while processing the request.');
    }
  };
