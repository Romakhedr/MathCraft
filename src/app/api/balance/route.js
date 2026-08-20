import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Minimal ERC-20 ABI — only the balanceOf function is needed
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)"
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet || !ethers.isAddress(wallet)) {
      return NextResponse.json(
        { success: false, error: 'A valid wallet address is required.' },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: 'CONTRACT_ADDRESS is not configured on the server.' },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

    const balanceWei = await contract.balanceOf(wallet);
    const balance = parseFloat(ethers.formatEther(balanceWei));

    return NextResponse.json({ success: true, balance });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
