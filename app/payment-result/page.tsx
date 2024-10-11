'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

    let attempts = 0
    const maxAttempts = 30 // Try for about 1 minute (30 * 2 seconds)

    const fetchPaymentResult = async () => {
      try {
        const response = await fetch(`/api/payment-callback?referenceText=${referenceText}`)
        if (response.ok) {
          const data = await response.json()
          setPaymentResult(data)
          setLoading(false)
        } else if (response.status === 404) {
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(fetchPaymentResult, 2000) // Retry after 2 seconds
          } else {
            setError('Payment result not found after multiple attempts. Please check your payment status later.')
            setLoading(false)
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } catch (error) {
        console.error('Error fetching payment result:', error)
        setError('An error occurred while fetching the payment result. Please try refreshing the page.')
        setLoading(false)
      }
    }

    fetchPaymentResult()

    // Cleanup function to handle component unmount
    return () => {
      attempts = maxAttempts // This will stop any ongoing polling if the component unmounts
    }
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
          <p>No payment result found. The payment might still be processing. Please check your payment status later.</p>
        </CardContent>
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
    </Card>
  )
}