import React from 'react'
import { twMerge, join } from 'tailwind-merge'

type Props = {
  labelClassName?: string
  labelImageSrc?: string
  valueClassName?: string
  label: string,
  value: any,
  onClick?: () => void,
}

export const LabelColumn = ({ 
  labelClassName, 
  labelImageSrc,
  valueClassName, 
  label, 
  value, 
  onClick,
}: Props) => {
  return (
    <div 
      className={join(
        "flex flex-col",
        "w-[160px]",
        "border-b-[1px] border-[#747780]",
        "pb-[15px]",
      )}
      onClick={onClick}
    >
      <p 
        className={twMerge(
          join(
            "flex",
            "text-[18px] font-normal text-gray",
            "leading-[20px]",
            "text-gray",
          ),
          labelClassName,
        )}
      >
        {labelImageSrc && <img className="w-[20px] h-[20px] mr-[8px]" src={labelImageSrc} />}
        {label}
      </p>
      <p 
        className={twMerge(
          join(
            "text-[16px] font-normal",
            "text-gray",
          ),
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  )
}