import React from 'react'
import { twMerge, join } from 'tailwind-merge'
import { ReactNode } from 'react';
import Loading from '../Loading';

type Props = {
  title: string | ReactNode,
  disabled?: boolean,
  description?: string,
  rootClassName?: string,
  className?: string,
  iconSrc?: string,
  isLoading?: boolean,
  onClick: (...args: any[]) => void,
}

const Button = ({ 
  iconSrc, 
  rootClassName,
  className, 
  disabled, 
  title, 
  description, 
  onClick,
  isLoading,
}: Props) => {
  return (
    <div 
      className={twMerge(
        "flex flex-col",
        rootClassName
      )}
    >
      <button
        disabled={disabled}
        className={
          twMerge(
            join(
              "flex items-center justify-center",
              "min-w-[100px] h-[64px]",
              "font-bold text-white text-[20px]",
              "rounded-[5px]",
              disabled ? "opacity-50 cursor-not-allowed" : "",
            ),
            className,
          )
        }
        onClick={onClick}
      >
        {isLoading 
          ? <Loading />
          : (
            <>
              {!!iconSrc && <img className="w-[16px] h-[16px] mr-[6px]" src={iconSrc} />}
              {title}
            </>
          )
        }
      </button>
      {!!description && (
        <p 
          className={join(
            "w-[100%] mt-[6px]",
            "text-white/30 text-[11px] font-medium text-center",
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}

export default Button