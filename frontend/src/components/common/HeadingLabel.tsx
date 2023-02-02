import React, { ReactElement } from 'react'
import { twMerge, join } from 'tailwind-merge'
import Pagination from './Pagination'

type Props = {
  title: string,
  right?: ReactElement
}

const HeadingLabel = ({ title, right }: Props) => {
  return (
    <div 
      className={join(
        "flex",
        "w-[100%]",
        "justify-between",
        "mb-[24px]",
      )}
    >
      <p 
        className={join(
          "text-[20px] font-bold text-skyblue",
        )}
      >
        {title}
      </p>
      {!!right && right}
    </div>
  )
}

export default HeadingLabel