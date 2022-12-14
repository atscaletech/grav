import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import styled from 'styled-components/macro';

import { Row, Col, Typography, PageHeader, Divider } from 'antd';
import Loading from '../components/Loading';
import LineItem from '../components/LineItem';
import ShippingForm from '../components/ShippingForm';
import PaymentSection from '../components/PaymentSection';

import useQuery from "../hooks/useQuery";

import GravApi from '../services/grav-api';
import formatCurrency from '../utils/formatCurrency';

const { Title } = Typography;

const TotalContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 144px;
`;

const StyledTitle = styled(Title)`
  margin-top: 0px !important;
`;


export default function Checkout() {
  const query = useQuery();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState(null);

  const orderId = query.get('order_id');
  // const successUrl = query.get('success_url');
  const cancelUrl = query.get('cancel_url');

  const fetchOrder = async () => {
    setIsLoading(true);

    try {
      const order = await GravApi.getOrder(orderId);
      setOrder(order);
    } catch(error) {
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  // eslint-disable-next-line
  }, [orderId]);

  const onCancel = () => {
    if (cancelUrl) {
      navigate(cancelUrl);
    }
  };

  const onPaymentComplete = async (payer, tx_hash) => {
    setIsLoading(true);

    await GravApi.checkout({
      orderId: order.id,
      payer,
      amount: order.amount,
      currency: order.currency,
      tx_hash,
    });

    navigate('/success');

    setIsLoading(false);
  };
  
  return (
    <>
      <Loading isLoading={isLoading}/>
      <PageHeader
        onBack={onCancel}
        title="Checkout"
      />
      {
        !!order && 
        <Row gutter={24}>
          <Col span={12} style={{ padding: '8px 32px', borderRight: "solid 1px #ABB6B2" }}>
            <ShippingForm/>
          </Col>
          <Col span={12} style={{ padding: '8px 32px' }}>
            {
              order.line_items.map(
                (item, index) => 
                  <LineItem 
                    key={index} 
                    productImage={item.featured_image.url} 
                    productTitle={item.product_title}
                    quantity={item.quantity}
                    price={formatCurrency(item.final_price * 10000, order.currency)}
                    currency={order.currency}
                  />
              )
            }
            <Divider/>
            <TotalContainer>
              <StyledTitle level={4}>Total</StyledTitle>
              <StyledTitle level={4}>{formatCurrency(order.amount, order.currency)} {order.currency}</StyledTitle>
            </TotalContainer>
            <Divider/>
            <PaymentSection
              amount={order.amount}
              currency={order.currency}
              shopWalletAddress={order.shop.wallet}
              onPaymentComplete={onPaymentComplete}
            />
          </Col>
        </Row>
      }
    </>
  )
};
