import React from 'react'
import { twMerge, join } from 'tailwind-merge'

import { LineWobble } from '@uiball/loaders'

type Props = {
  
}

const Loading = ({  }: Props) => {
  return (
    <LineWobble
      size={80}
      lineWeight={5}
      speed={1.75}
      color="#06E6E6"
    />
  )
}

export default Loading
