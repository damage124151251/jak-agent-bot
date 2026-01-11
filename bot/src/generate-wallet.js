import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const wallet = Keypair.generate();

console.log('\n========================================');
console.log('   JAK AGENT - NOVA WALLET GERADA');
console.log('========================================\n');
console.log('PUBLIC KEY (endereço):');
console.log(wallet.publicKey.toBase58());
console.log('\nPRIVATE KEY (Base58 - GUARDAR):');
console.log(bs58.encode(wallet.secretKey));
console.log('\nPRIVATE KEY (JSON Array):');
console.log(JSON.stringify(Array.from(wallet.secretKey)));
console.log('\n========================================');
console.log('IMPORTANTE: Envie 0.5 SOL para o endereço acima!');
console.log('========================================\n');
