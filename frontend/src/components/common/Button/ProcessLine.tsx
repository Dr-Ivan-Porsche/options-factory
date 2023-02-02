import React from 'react'
import { twMerge, join } from 'tailwind-merge'

type Props = {
  
}

const ProcessLine = ({ }: Props) => {
  return (
    <div
      className={join(
        "flex w-[11px] h-[1px]",
        "m-auto",
        "bg-black4",
      )}
    />
  )
}

export default ProcessLine