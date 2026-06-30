// app/api/solve/route.js
import { solveTransport } from '@/utils/algorithms';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { supply, demand, costs, method } = await request.json();
    if (!supply || !demand || !costs) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    const result = solveTransport(supply, demand, costs, method);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}