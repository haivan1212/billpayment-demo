'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface PaymentCallback {
  trxId: string
  transactionId: string
  referenceText: string
  userId: string
  serviceCode: string
  providerCode: string
  providerName: string
  amount: number
  billNo: string
  billId: string
  billCycle: string
  billName: string
  billAddress: string
  additionalData: string
  respCode: string
  respMessage: string
}

export default function PaymentResultPage() {
  const [paymentResult, setPaymentResult] = useState<PaymentCallback | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const referenceText = searchParams.get('referenceText')
    if (!referenceText) {
      setError('No reference text provided')
      setLoading(false)
      return
    }

    const fetchPaymentResult = async () => {
      try {
        const response = await fetch(`/api/payment-callback?referenceText=${referenceText}`)
        console.log(JSON.stringify(response))
        if (response.ok) {
          const data = await response.json()
          setPaymentResult(data)
          setLoading(false)
        } else if (response.status === 404) {
          // If result not found, continue polling
          setTimeout(fetchPaymentResult, 2000)
        } else {
          setError('Failed to fetch payment result')
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching payment result:', error)
        setError('An error occurred while fetching the payment result')
        setLoading(false)
      }
    }

    fetchPaymentResult()
  }, [searchParams])

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Payment Result</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">Waiting for payment result...</p>
          <Skeleton className="w-full h-6 mb-2" />
          <Skeleton className="w-3/4 h-6 mb-2" />
          <Skeleton className="w-1/2 h-6" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
        <CardFooter>
          <Link href="/" passHref>
            <Button>Back to Main Page</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (!paymentResult) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Payment Result</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No payment result found. The payment might still be processing.</p>
        </CardContent>
        <CardFooter>
          <Link href="/" passHref>
            <Button>Back to Main Page</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Payment Result</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <dt className="font-semibold">Status:</dt>
          <dd>{paymentResult.respCode === '00' ? 'Success' : 'Failed'}</dd>
          <dt className="font-semibold">Message:</dt>
          <dd>{paymentResult.respMessage}</dd>
          <dt className="font-semibold">Amount:</dt>
          <dd>{paymentResult.amount.toLocaleString()}</dd>
          <dt className="font-semibold">Transaction ID:</dt>
          <dd>{paymentResult.transactionId}</dd>
          <dt className="font-semibold">Bill Number:</dt>
          <dd>{paymentResult.billNo}</dd>
          <dt className="font-semibold">Bill Name:</dt>
          <dd>{paymentResult.billName}</dd>
          <dt className="font-semibold">Bill Cycle:</dt>
          <dd>{paymentResult.billCycle}</dd>
          <dt className="font-semibold">Service:</dt>
          <dd>{paymentResult.serviceCode}</dd>
          <dt className="font-semibold">Provider:</dt>
          <dd>{paymentResult.providerName}</dd>
          <dt className="font-semibold">User ID:</dt>
          <dd>{paymentResult.userId}</dd>
          <dt className="font-semibold">Bill Address:</dt>
          <dd>{paymentResult.billAddress}</dd>
          <dt className="font-semibold">Additional Data:</dt>
          <dd>{paymentResult.additionalData}</dd>
        </dl>
      </CardContent>
      <CardFooter>
        <Link href="/" passHref>
          <Button>Back to Main Page</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}