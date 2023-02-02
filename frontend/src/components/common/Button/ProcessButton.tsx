import React, { ReactNode } from 'react'
import { twMerge, join } from 'tailwind-merge'
import Button from './Button'
import ProcessLine from './ProcessLine'
import ProcessNumber from './ProcessNumber'

type ButtonItem = {
  title: string,
  isDisabled: boolean,
  onClick: (...args: any[]) => void,
  isLoading?: boolean,
}

type Props = {
  buttons: ButtonItem[],
  processCursorIdx: number,
}

const ProcessButton = ({ buttons, processCursorIdx }: Props) => {
  return (
    <div className="flex items-center">
      {buttons.map(({ title, isDisabled, onClick, isLoading }, idx) => {
        const isLastButton = idx === buttons.length - 1
        
        return (
          <div className="relative flex items-center">
            {/* if the idx is less than processCursorIdx: the item already processed. */}
            <ProcessNumber
              isDisabled={isDisabled}
              num={idx + 1}
              processCursorIdx={processCursorIdx}
            />
            <Button
              isLoading={isLoading}
              className={join(
                "pl-[36px]",
                isDisabled && [
                  "border-white2/30", 
                  "text-white2/30", 
                  "hover:shadow-none", 
                  "hover:text-white2/30",
                  "hidden dt:flex"
                ]
              )}
              title={title} 
              onClick={() => {
                if (isDisabled) return
                onClick()
              }}
            />
            {!isLastButton && <ProcessLine />}
          </div>
        )
      })}
    </div>
  )
}

export default ProcessButton