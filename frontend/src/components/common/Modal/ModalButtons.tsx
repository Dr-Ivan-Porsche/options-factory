import React, { ReactNode } from 'react'
import { twMerge, join } from 'tailwind-merge'
import Button from '../Button/Button'

type Props = {
  className?: string
  onCancel: (...args: any[]) => void,
  right?: ReactNode
}

const ModalButtons = ({ className, onCancel, right }: Props) => {
  return (
    <div 
      className={
        twMerge(
          join(
            "flex justify-between",
            "w-[100%] dt:w-auto",
          ),
          className
        )
      }
    >
      <Button 
        className={join(
          "hidden dt:flex",
          "w-[166px]",
          "border border-dove border-solid bg-transparent text-dove",
        )}
        title="Cancel" 
        onClick={onCancel} 
      />
      {right}
    </div>
  )
}

export default ModalButtons