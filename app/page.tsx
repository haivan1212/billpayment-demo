'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as Constant from './config/config'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { generateRandomString } from './utils/utils'

interface Service {
  code: string
  name: string
}

interface Provider {
  code: string
  name: string
}

interface BillCycle {
  billId: string
  fromDate: string
  toDate: string
  billAmount: number
  note: string
  selected: boolean
  description: string
  serviceCode: string
}

interface BillDetail {
  respCode: string
  respMessage: string
  walletId: string
  serviceCode: string
  provider: {
    code: string
    name: string
  }
  billNo: string
  billName: string
  billAddress: string
  amount: number
  currency: string
  billCycles: BillCycle[]
  inquiryId: string
}

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

// interface PaymentResultDTO {
//   connectorCode: string
//   message: string
// }

export default function BillPaymentDemo() {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [billNo, setBillNo] = useState('')
  const [billDetails, setBillDetails] = useState<BillDetail | null>(null)
  const [selectedBillCycle, setSelectedBillCycle] = useState<string>('')
  const [payAmount, setPayAmount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'declined'>('idle')
  const { toast } = useToast()

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${Constant.API_URL}/paybill/services`)
        setServices(response.data)
      } catch (err) {
        console.error('Error fetching services:', err)
        setError('Failed to load services. Please try again later.')
      }
    }
    fetchServices()
  }, [])

  useEffect(() => {
    if (selectedService) {
      const fetchProviders = async () => {
        try {
          const response = await axios.get(`${Constant.API_URL}/paybill/services/${selectedService}/providers`)
          setProviders(response.data)
          setSelectedProvider('')
          setBillDetails(null)
        } catch (err) {
          console.error('Error fetching providers:', err)
          setError('Failed to load providers. Please try again later.')
        }
      }
      fetchProviders()
    }
  }, [selectedService])

  useEffect(() => {
    if (billDetails) {
      if (billDetails.billCycles.length === 1) {
        setSelectedBillCycle(billDetails.billCycles[0].billId)
        setPayAmount(billDetails.amount)
      } else if (selectedBillCycle) {
        const selectedCycle = billDetails.billCycles.find(cycle => cycle.billId === selectedBillCycle)
        if (selectedCycle) {
          setPayAmount(selectedCycle.billAmount)
        }
      } else {
        setPayAmount(0)
      }
    } else {
      setPayAmount(0)
    }
  }, [billDetails, selectedBillCycle])

  const handleServiceSelect = (serviceCode: string) => {
    setSelectedService(serviceCode)
    setProviders([])
    setBillDetails(null)
    setError(null)
  }

  const handleProviderSelect = (providerCode: string) => {
    setSelectedProvider(providerCode)
    setBillDetails(null)
    setError(null)
  }

  const handleBillQuery = async () => {
    if (!selectedService || !selectedProvider || !billNo) {
      setError('Please select a service, provider, and enter a bill number.')
      return
    }

    try {
      const response = await axios.post(`${Constant.API_URL}/paybill/query`, {
        merchantCode: Constant.MERCHANT_CODE,
        userId: Constant.MERCHANT_USER_ID,
        serviceCode: selectedService,
        providerCode: selectedProvider,
        billNo: billNo
      })
      setBillDetails(response.data.response)
      setSelectedBillCycle('')
      setError(null)
    } catch (err) {
      console.error('Error querying bill details:', err)
      setError('Failed to fetch bill details. Please check your inputs and try again.')
      setBillDetails(null)
    }
  }

  const handleBillCycleSelect = (billId: string) => {
    setSelectedBillCycle(billId)
  }

  const handlePay = async () => {
    if (!billDetails || !selectedBillCycle) {
      setError('Please select a bill cycle to pay.')
      return
    }

    setPaymentStatus('processing')

    try {
      const response = await axios.post(`${Constant.API_URL}/paybill/pay`, {
        merchantCode: Constant.MERCHANT_CODE,
        trxId: generateRandomString(16),
        userId: Constant.MERCHANT_USER_ID,
        billNo: billDetails.billNo,
        billId: selectedBillCycle,
        amount: payAmount,
        inquiryId: billDetails.inquiryId
      })
      
      // Redirect to payment gateway
      if (response.data.paymentURL) {
        window.location.href = response.data.paymentURL
      } else {
        setError('Failed to get payment URL from the server.')
        setPaymentStatus('idle')
      }
    } catch (err) {
      console.error('Error initiating payment:', err)
      setError('Failed to initiate payment. Please try again.')
      setPaymentStatus('idle')
    }
  }

  // Callback function for payment notification
  const handlePaymentCallback = (callbackData: PaymentCallback) => {
    if (callbackData.respCode === '00') {
      setPaymentStatus('success')
      toast({
        title: "Payment Successful",
        description: `Transaction ID: ${callbackData.transactionId}, Amount: ${callbackData.amount}`,
      })
    } else if (callbackData.respCode === '01') {
      setPaymentStatus('declined')
      toast({
        title: "Payment Declined",
        description: callbackData.respMessage,
      })
    }

    // Reset the form
    setSelectedService('')
    setSelectedProvider('')
    setBillNo('')
    setBillDetails(null)
    setSelectedBillCycle('')
    setPayAmount(0)
  }

  // Simulating the callback API endpoint
  useEffect(() => {
    const callbackEndpoint = '/api/payment-callback'
    const eventSource = new EventSource(callbackEndpoint)

    eventSource.onmessage = (event) => {
      const callbackData: PaymentCallback = JSON.parse(event.data)
      handlePaymentCallback(callbackData)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bill Payment Demo</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Select Service and Provider</CardTitle>
          <CardDescription>Choose a service and provider to pay your bill</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-select">Service</Label>
            <Select onValueChange={handleServiceSelect} value={selectedService}>
              <SelectTrigger id="service-select">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.code} value={service.code}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedService && (
            <div className="space-y-2">
              <Label htmlFor="provider-select">Provider</Label>
              <Select onValueChange={handleProviderSelect} value={selectedProvider}>
                <SelectTrigger id="provider-select">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.code} value={provider.code}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bill-no">Bill Number</Label>
            <Input 
              id="bill-no"
              type="text" 
              placeholder="Enter bill number" 
              value={billNo} 
              onChange={(e) => setBillNo(e.target.value)} 
            />
          </div>

          <Button onClick={handleBillQuery}>Query Bill</Button>
        </CardContent>
      </Card>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {billDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Bill Details</CardTitle>
            <CardDescription>Summary of your bill</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bill Name</Label>
                <p>{billDetails.billName}</p>
              </div>
              <div>
                <Label>Bill Address</Label>
                <p>{billDetails.billAddress}</p>
              </div>
              <div>
                <Label>Total Amount</Label>
                <p>{billDetails.amount.toLocaleString()} {billDetails.currency}</p>
              </div>
              <div>
                <Label>Provider</Label>
                <p>{billDetails.provider.name}</p>
              </div>
            </div>

            {billDetails.billCycles.length > 1 && (
              <RadioGroup value={selectedBillCycle} onValueChange={handleBillCycleSelect}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>From Date</TableHead>
                      <TableHead>To Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Select</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billDetails.billCycles.map((cycle) => (
                      <TableRow key={cycle.billId}>
                        <TableCell>{cycle.description}</TableCell>
                        <TableCell>{cycle.fromDate}</TableCell>
                        <TableCell>{cycle.toDate}</TableCell>
                        <TableCell>{cycle.billAmount.toLocaleString()} {billDetails.currency}</TableCell>
                        <TableCell>
                          <RadioGroupItem value={cycle.billId} id={cycle.billId} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </RadioGroup>
            )}

            {billDetails.billCycles.length === 1 && (
              <div>
                <Label>Bill Cycle</Label>
                <p>{billDetails.billCycles[0].description}</p>
                <p>From: {billDetails.billCycles[0].fromDate} To: {billDetails.billCycles[0].toDate}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <Label>Pay Amount</Label>
                <p className="text-2xl font-bold">{payAmount.toLocaleString()} {billDetails.currency}</p>
              </div>
              <Button onClick={handlePay} disabled={paymentStatus === 'processing'}>
                {paymentStatus === 'processing' ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Toaster />
    </div>
  )
}