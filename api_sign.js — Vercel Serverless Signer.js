const { ethers } = require('ethers');

// Diisi di Vercel Dashboard → Environment Variables
// Key: SIGNER_PRIVATE_KEY
// Value: private key wallet 0x1a7a1d7ac8daf0d18182b54bde78e834d35b0702
const SIGNER_PK = process.env.SIGNER_PRIVATE_KEY;

const CONTRACT  = '0xc19fE671cB7bAe0641CD940550bB6398EF68DaD4';
const CHAIN_ID  = 1;      // Ethereum mainnet
const EXPIRY    = 600;    // 10 menit

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { wallet } = req.body || {};

  if (!wallet || !ethers.isAddress(wallet))
    return res.status(400).json({ error: 'Invalid wallet address' });

  if (!SIGNER_PK)
    return res.status(500).json({ error: 'Signer not configured' });

  try {
    const deadline = Math.floor(Date.now() / 1000) + EXPIRY;
    const signer   = new ethers.Wallet(SIGNER_PK);

    // Hash identik dgn kontrak:
    // keccak256(abi.encodePacked(msg.sender, deadline, block.chainid, address(this)))
    const innerHash = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint256', 'uint256', 'address'],
        [wallet, deadline, CHAIN_ID, CONTRACT]
      )
    );

    // signMessage otomatis tambah EIP-191 prefix — sesuai dgn _recover() di kontrak
    const signature = await signer.signMessage(ethers.getBytes(innerHash));

    return res.status(200).json({ signature, deadline });

  } catch (e) {
    console.error('Sign error:', e.message);
    return res.status(500).json({ error: 'Signing failed' });
  }
};