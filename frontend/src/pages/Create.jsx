import React from 'react'
import { useLocation } from 'react-router-dom'
import CreateCrds from '../components/createpage/CreateCrds'
import AIDesign from '../components/createpage/CardsPages/AIDesign'

export const Create = () => {
  const { pathname } = useLocation();
  const isAIDesign = pathname === '/ai-design';
  if (isAIDesign) {
    return <AIDesign />
  }
  return (
    <>
      
      <CreateCrds />
    </>
  )
}
