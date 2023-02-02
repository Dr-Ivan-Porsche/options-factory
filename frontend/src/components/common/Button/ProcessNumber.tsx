import React from 'react'
import { twMerge, join } from 'tailwind-merge'

type Props = {
  num: number
  processCursorIdx: number
  isDisabled?: boolean
}

const ProcessNumber = ({ num, processCursorIdx, isDisabled }: Props) => {
  const idx = num - 1
  const isTarget = processCursorIdx === idx
  return (
    <div
      className={join(
        "left-0 top-0",
        isDisabled 
          ? "static dt:absolute"
          : "absolute",
        isDisabled 
          ? "w-[36px] h-[36px] dt:w-[24px] dt:h-[100%]"
          : "w-[24px] h-[100%]",
        "flex items-center justify-center",
        "text-black2",
        (isTarget && !isDisabled) ? "bg-primary" : "bg-black4"
      )}
    >
      {processCursorIdx > idx
        ? <img 
            className="w-[24px] h-[24px]"
            src="/assets/images/processed.svg" 
          />
        : num
      }
    </div>
  )
}

export default ProcessNumber