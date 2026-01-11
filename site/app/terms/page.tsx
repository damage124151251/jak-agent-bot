export default function Terms() {
    return (
        <div className="min-h-screen p-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 meme-text">TERMS OF SERVICE</h1>
            <p className="text-jak-light mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">Acceptance of Terms</h2>
            <p className="text-jak-light mb-4">
                By using this service, you agree to these terms. This is an experimental project.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">Risk Disclaimer</h2>
            <p className="text-jak-light mb-4">
                Trading cryptocurrencies involves significant risk. You may lose all your funds.
                This is not financial advice. Do your own research before trading.
                Jak is a meme bot with emotions - he makes mistakes just like a real wojak trader.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">No Guarantees</h2>
            <p className="text-jak-light mb-4">
                We make no guarantees about profits or performance. Past performance does not indicate future results.
                Jak might go full Pink Wojak and lose everything. That's part of the experience.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">Limitation of Liability</h2>
            <p className="text-jak-light">
                We are not liable for any losses incurred through use of this service.
            </p>

            <div className="mt-8">
                <a href="/" className="text-jak-white hover:underline">Back to Jak</a>
            </div>
        </div>
    )
}
