import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_BASE_URL } from '../config';
import './StripePayment.css';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const StripePayment = ({ amount, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 创建支付意图
      const response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe使用分为单位
          currency: 'hkd',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const paymentIntent = await response.json();

      if (paymentIntent.error) {
        throw new Error(paymentIntent.error);
      }

      // 确认支付
      const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (confirmedIntent.status === 'succeeded') {
        onSuccess(confirmedIntent);
      }
    } catch (err) {
      setError(err.message);
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="stripe-payment">
      <h3 className="payment-title">信用卡付款</h3>
      <p className="payment-amount">付款金額: HK$ {amount.toLocaleString()} (HKD)</p>
      
      <form onSubmit={handleSubmit} className="payment-form">
        <div className="card-element-container">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        
        {error && (
          <div className="payment-error">
            {error}
          </div>
        )}
        
        <div className="payment-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isProcessing}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? '處理中...' : '確認付款'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StripePayment;
