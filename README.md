# RAC Graph - AI-driven Process Compliance and Risk Management Platform

An AI-driven platform for evaluating business processes against policies and regulations, identifying compliance gaps and risk exposures, and receiving actionable recommendations for improvements.

## Project Structure

This is a monorepo using Turborepo with the following structure:

- `apps/web`: Next.js frontend application
- `packages/shared`: Shared utilities and types
- `packages/database`: Neo4j graph database client and models
- `packages/ai-service`: AI services using LLMs and vector databases

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose for running Neo4j, Pinecone, and Ollama

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/rac-graph.git
   cd rac-graph
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Then update the environment variables with your own values.

4. Start the Docker containers:
   ```bash
   docker-compose up -d
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Build all packages and applications

```bash
npm run build
```

### Run tests

```bash
npm run test
```

### Lint the codebase

```bash
npm run lint
```

## Components

### Neo4j Graph Database

The platform uses Neo4j for storing and querying graph data, representing business processes, risks, and controls.

### Pinecone Vector Database

Pinecone is used for storing and querying document embeddings, enabling semantic search capabilities.

### Local LLM (Ollama)

The platform uses Ollama to run LLMs locally for AI analysis, ensuring data privacy and security.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 