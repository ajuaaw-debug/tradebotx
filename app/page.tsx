export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <div className="inline-block bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm px-4 py-1.5 rounded-full mb-8">
          Coming Soon — MVP in Development
        </div>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          AI Trading Bot Marketplace
        </h1>

        <p className="text-gray-400 text-xl mb-12 leading-relaxed">
          Browse, deploy, and profit from AI-powered trading bots.
          Built for serious traders.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <button className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Get Early Access
          </button>
          <button className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-medium transition-colors">
            View Roadmap
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8 border-t border-gray-800 pt-12">
          <div>
            <div className="text-3xl font-bold text-white mb-1">500+</div>
            <div className="text-gray-500 text-sm">Trading strategies</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">5</div>
            <div className="text-gray-500 text-sm">Exchanges supported</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">AI</div>
            <div className="text-gray-500 text-sm">Bot generator</div>
          </div>
        </div>
      </div>
    </main>
  );
}
