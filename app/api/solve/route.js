import { solveTransport } from '@/utils/algorithms';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { supply, demand, costs } = await request.json();
    if (!supply || !demand || !costs) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    const result = solveTransport(supply, demand, costs);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}