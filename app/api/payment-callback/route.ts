import { NextResponse } from 'next/server'

const paymentResults: Record<string, string> = {}

export async function POST(request: Request) {
  const body = await request.json()
  
  // Store the payment result
  paymentResults[body.referenceText] = body

  return NextResponse.json({ status: 'success' })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const referenceText = searchParams.get('referenceText')

  if (!referenceText) {
    return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
  }

  const paymentResult = paymentResults[referenceText]

  if (!paymentResult) {
    return NextResponse.json({ error: 'Payment result not found' }, { status: 404 })
  }

  return NextResponse.json(paymentResult)
}