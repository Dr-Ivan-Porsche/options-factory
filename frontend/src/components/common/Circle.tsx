import React from 'react'
import { twMerge, join } from 'tailwind-merge'

type Props = {
  active: boolean
  className?: string
}

const Circle = ({ active, className }: Props) => {
  return active 
    ? <img 
        className={twMerge("w-[24px] h-[24px]", className)} 
        src="/assets/images/circle-active.svg" 
      />
    : <img 
        className={twMerge("w-[24px] h-[24px]", className)} 
        src="/assets/images/circle-inactive.svg" 
      />
}

export default Circle