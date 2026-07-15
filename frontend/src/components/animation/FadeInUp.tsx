import { type ReactNode } from 'react'
import { MotiView } from 'moti'

interface FadeInUpProps {
  children: ReactNode
  delay?: number
  duration?: number
  offset?: number
  testID?: string
}

export function FadeInUp({
  children,
  delay = 0,
  duration = 400,
  offset = 24,
  testID,
}: FadeInUpProps) {
  return (
    <MotiView
      testID={testID}
      from={{ opacity: 0, translateY: offset }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 120,
        delay,
      }}
    >
      {children}
    </MotiView>
  )
}
