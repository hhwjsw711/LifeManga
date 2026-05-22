declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY?: string;
  }
}

declare const process: { env: NodeJS.ProcessEnv };
