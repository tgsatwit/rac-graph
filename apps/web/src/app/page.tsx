export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">
          Process Compliance and Risk Management Platform
        </h1>
        <p className="text-xl mb-8">
          AI-driven analysis for business process compliance and risk assessment
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Knowledge Base</h2>
            <p>Manage policies, regulations, and frameworks</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Process Modeling</h2>
            <p>Create and analyze business process models</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Risk Assessment</h2>
            <p>Identify and manage process risks</p>
          </div>
        </div>
      </div>
    </main>
  );
} 