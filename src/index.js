import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
  defaultQuery: {
    "api-version": "2025-01-01-preview",
  },
  defaultHeaders: {
    "api-key": import.meta.env.VITE_OPENAI_API_KEY,
  },
  dangerouslyAllowBrowser: true,
});

export default openai;
