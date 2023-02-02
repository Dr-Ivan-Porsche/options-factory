import React from 'react'
import { twMerge, join } from 'tailwind-merge'
import Close from './Close'

type Props = {
  className?: string,
  onClose?: (...args: any[]) => void,
  left?: React.ReactNode
}

const Heading = ({ className, onClose, left }: Props) => {
  return (
    <div 
      className={twMerge(
        join(
          "flex items-center justify-between break-all",
          "overflow-hidden",
          "mb-[20px] dt:mb-[16px]",
        ),
        className,
      )}
    >
      {left}
      {!!onClose && <Close onClose={onClose} />}
    </div>
  )
}

export default Heading