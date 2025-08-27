import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../stripe';
import StripePayment from './StripePayment';
import './PaymentFlow.css';

const PaymentFlow = ({ amount, onPaymentSuccess, onPaymentCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [showStripeForm, setShowStripeForm] = useState(false);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'credit') {
      setShowStripeForm(true);
    } else {
      setShowStripeForm(false);
    }
  };

  const handleStripeSuccess = (paymentIntent) => {
    onPaymentSuccess({
      method: 'credit',
      transactionId: paymentIntent.id,
      amount: amount,
      status: 'completed'
    });
  };

  const handleStripeError = (error) => {
    console.error('Stripe payment error:', error);
    // 可以在这里添加错误处理逻辑
  };

  const handleStripeCancel = () => {
    setShowStripeForm(false);
    onPaymentCancel();
  };

  const handleOtherPaymentSubmit = (e) => {
    e.preventDefault();
    // 对于其他支付方式，直接标记为成功
    onPaymentSuccess({
      method: paymentMethod,
      transactionId: `manual_${Date.now()}`,
      amount: amount,
      status: 'pending'
    });
  };

  return (
    <div className="payment-flow">
      <div className="payment-flow-content">
        <h3 className="payment-flow-title">選擇付款方式</h3>
        
        <div className="payment-methods">
          <label className="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="credit"
              checked={paymentMethod === 'credit'}
              onChange={() => handlePaymentMethodChange('credit')}
            />
            <span className="payment-method-label">
              <span className="payment-icon">💳</span>
              信用卡付款
            </span>
          </label>
          
          <label className="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={() => handlePaymentMethodChange('cod')}
            />
            <span className="payment-method-label">
              <span className="payment-icon">💰</span>
              貨到付款
            </span>
          </label>
          
          <label className="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="bank"
              checked={paymentMethod === 'bank'}
              onChange={() => handlePaymentMethodChange('bank')}
            />
            <span className="payment-method-label">
              <span className="payment-icon">🏦</span>
              銀行轉帳
            </span>
          </label>
        </div>

        {paymentMethod === 'credit' && showStripeForm && (
          <div className="stripe-payment-container">
            <Elements stripe={stripePromise}>
              <StripePayment
                amount={amount}
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
                onCancel={handleStripeCancel}
              />
            </Elements>
          </div>
        )}

        {paymentMethod !== 'credit' && (
          <div className="other-payment-info">
            <h4>付款資訊</h4>
            {paymentMethod === 'cod' && (
              <p>選擇貨到付款，商品送達時請準備現金付款。</p>
            )}
            {paymentMethod === 'bank' && (
              <div>
                <p>請使用以下銀行帳號進行轉帳：</p>
                <div className="bank-info">
                  <p><strong>銀行：</strong>香港銀行</p>
                  <p><strong>帳號：</strong>1234-5678-9012-3456</p>
                  <p><strong>戶名：</strong>您的商店名稱</p>
                </div>
                <p className="note">※ 轉帳完成後，請保留轉帳收據</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleOtherPaymentSubmit}
              className="btn btn-primary"
            >
              確認付款方式
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentFlow;
