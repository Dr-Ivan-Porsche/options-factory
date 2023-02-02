import React from 'react'
import { twMerge, join } from 'tailwind-merge'

type Props = {
  percentage: string,
}

const Gauge = ({ percentage }: Props) => {
  return (
    <div className="flex relative w-[72px] h-[2px] mx-[12px] bg-darkgray">
      <div
        style={{ width: percentage }}
        className={join(
          "absolute left-0 top-0",
          "h-[100%]",
          "bg-primary",
        )}
      />
    </div>
  )
}

export default Gauge