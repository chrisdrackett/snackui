import React from 'react'

import { spacedChildren } from '../helpers/spacedChildren'
import { themeable } from '../helpers/themeable'
import { useTheme } from '../hooks/useTheme'
import { HStack, StackProps } from './Stacks'
import { Text, TextProps } from './Text'

export type ButtonProps = StackProps & {
  textProps?: Omit<TextProps, 'children'>
  noTextWrap?: boolean
  theme?: string | null
  icon?: JSX.Element | null
}

// TODO colors, spacing, static extract + colors/spacing
// TODO sizing, static + sizing
// TODO auto-chain

export const Button = themeable(
  ({
    children,
    icon,
    spacing = 'sm',
    flexDirection = 'row',
    textProps,
    noTextWrap,
    theme: themeName,
    ...props
  }: ButtonProps) => {
    const theme = useTheme()

    const childrens = noTextWrap ? (
      children
    ) : !children ? null : textProps ? (
      <Text color={theme.color} flex={1} ellipse {...textProps}>
        {children}
      </Text>
    ) : (
      <Text color={theme.color} flex={1} ellipse>
        {children}
      </Text>
    )

    return (
      <HStack
        backgroundColor={theme.backgroundColorSecondary}
        alignSelf="flex-start"
        justifyContent="center"
        alignItems="center"
        cursor="pointer"
        paddingVertical={10}
        paddingHorizontal={14}
        borderRadius={8}
        hoverStyle={{
          backgroundColor: theme.backgroundColorTertiary,
        }}
        pressStyle={{
          backgroundColor: theme.backgroundColorTertiary,
          transform: [{ scale: 0.96 }],
        }}
        flexDirection={flexDirection}
        {...props}
      >
        {spacedChildren({
          children:
            icon && childrens
              ? [
                  <React.Fragment key={0}>{icon}</React.Fragment>,
                  <React.Fragment key={1}>{childrens}</React.Fragment>,
                ]
              : icon ?? childrens,
          spacing,
          flexDirection,
        })}
      </HStack>
    )
  }
)

// if (process.env.IS_STATIC) {
//   Button.staticConfig = extendStaticConfig(HStack)
// }
