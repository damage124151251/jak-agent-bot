export default function Privacy() {
    return (
        <div className="min-h-screen p-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 meme-text">PRIVACY POLICY</h1>
            <p className="text-jak-light mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">Information We Collect</h2>
            <p className="text-jak-light mb-4">
                We collect wallet addresses for transaction purposes only. We do not collect personal information.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Information</h2>
            <p className="text-jak-light mb-4">
                Wallet addresses are used solely to execute and display transactions on the Solana blockchain.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">Data Storage</h2>
            <p className="text-jak-light mb-4">
                Transaction data is stored for display purposes. All blockchain data is public by nature.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">Contact</h2>
            <p className="text-jak-light">
                For questions about this policy, contact us on Twitter/X.
            </p>

            <div className="mt-8">
                <a href="/" className="text-jak-white hover:underline">Back to Jak</a>
            </div>
        </div>
    )
}
