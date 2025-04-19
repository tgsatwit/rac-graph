declare module '@langchain/langgraph' {
  export class StateGraph<T> {
    constructor(options: { channels: Record<string, any> });
    
    addNode(name: string, executor: { execute: (state: State<T>) => Promise<State<T>> | State<T> } | ((state: State<T>) => Promise<State<T>>)): void;
    addEdge(source: string, target: string): void;
    addConditionalEdges(source: string, condition: (state: T) => string): void;
    setEntryPoint(node: string): void;
    compile(): { invoke: (state: T) => Promise<T> };
  }

  export class State<T> {
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    clone(): State<T>;
  }
}

declare module 'langchain/schema/runnable' {
  export class RunnableSequence {
    static from(components: any[]): any;
  }
}

declare module 'langchain/schema' {
  export class BaseMessage {
    content: string;
    constructor(content: string);
  }
  
  export class HumanMessage extends BaseMessage {
    constructor(content: string);
  }
  
  export class SystemMessage extends BaseMessage {
    constructor(content: string);
  }
}

declare module 'langchain/document' {
  export class Document {
    pageContent: string;
    metadata: Record<string, any>;
    constructor(fields: { pageContent: string; metadata?: Record<string, any> });
  }
}

declare module 'langchain/chat_models/openai' {
  export class ChatOpenAI {
    constructor(options: { modelName: string; temperature: number });
    invoke(messages: any[]): Promise<{ content: string }>;
  }
} 