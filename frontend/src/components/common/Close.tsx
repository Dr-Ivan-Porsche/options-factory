import React from 'react'
import { twMerge, join } from 'tailwind-merge'

type Props = {
  imgSrc?: string,
  onClose: (...args: any[]) => void
}

const Close = ({ imgSrc, onClose }: Props) => {
  return (
    <img 
      onClick={onClose} src={imgSrc || "/assets/images/close.svg"}
      className="w-[24px] h-[24px] cursor-pointer" 
    />
  )
}

export default Close