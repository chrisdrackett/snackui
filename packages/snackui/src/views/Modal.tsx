import React from 'react'
import {
  Modal as ModalNative,
  ModalProps as ModalPropsReact,
  TouchableOpacity,
} from 'react-native'

import { isWeb } from '../constants'
import { prevent } from '../helpers/prevent'
import { useDebounceValue } from '../hooks/useDebounce'
import { useTheme } from '../hooks/useTheme'
import { AnimatedStackProps, AnimatedVStack } from './AnimatedStack'
import { AbsoluteVStack, StackProps, VStack } from './Stacks'

// TODO if we add `closableButton` prop we can control exit animation nicely

export type ModalProps = ModalPropsReact &
  Omit<AnimatedStackProps, 'animateState'> & {
    visible?: boolean
    overlayBackground?: string
    overlayDismisses?: boolean
  }

export const Modal = (props: ModalProps) => {
  const {
    // modal specific props
    visible = true,
    animationType = 'slide', // keep this only for native for now
    transparent = true,
    onRequestClose,
    onShow,
    // ios specific
    presentationStyle,
    supportedOrientations,
    onDismiss,
    onOrientationChange,
    // android specific
    hardwareAccelerated,
    statusBarTranslucent,
    // overlay
    overlayBackground = 'rgba(0,0,0,0.5)',
    overlayDismisses,
    // children
    children,
    height,
    width,
    minHeight,
    minWidth,
    maxWidth,
    maxHeight,
    velocity,
    animation,
    ...rest
  } = props

  // only shared between both
  const modalProps = {
    transparent,
    visible,
    onRequestClose,
    onShow,
    presentationStyle,
    supportedOrientations,
    onDismiss,
    onOrientationChange,
    hardwareAccelerated,
    statusBarTranslucent,
  }

  if (isWeb) {
    const pointerEvents = visible ? 'auto' : 'none'
    const modalVisible = useDebounceValue(visible, visible ? 200 : 0)

    return (
      <ModalNative {...modalProps} visible={modalVisible}>
        <AbsoluteVStack
          ref={preventFormFocusBug as any}
          fullscreen
          pointerEvents={pointerEvents}
          backgroundColor={visible ? overlayBackground : 'transparent'}
          alignItems="center"
          justifyContent="center"
          onPress={overlayDismisses ? onRequestClose : undefined}
        >
          <AnimatedVStack
            {...{
              height,
              width,
              minHeight,
              minWidth,
              maxWidth,
              maxHeight,
              velocity,
              pointerEvents,
              animateState: modalVisible ? 'in' : 'out',
              animation,
            }}
          >
            <ModalPane
              onPress={prevent}
              pointerEvents={pointerEvents}
              {...rest}
            >
              {children}
            </ModalPane>
          </AnimatedVStack>
        </AbsoluteVStack>
      </ModalNative>
    )
  }

  return (
    <ModalNative animationType={animationType} {...modalProps}>
      {/* fix for native: https://github.com/facebook/react-native/issues/26892 */}
      <TouchableOpacity
        activeOpacity={1}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          bottom: 0,
        }}
        onPressOut={(e) => {
          if (e.nativeEvent?.locationY) {
            onRequestClose?.()
          }
        }}
      >
        <VStack flex={1} {...rest} backgroundColor="green">
          {children}
        </VStack>
      </TouchableOpacity>
    </ModalNative>
  )
}

function ModalPane(props: StackProps) {
  const theme = useTheme()
  return (
    <VStack
      backgroundColor={theme.backgroundColor}
      borderRadius={20}
      alignItems="center"
      position="relative"
      shadowColor="rgba(0,0,0,0.35)"
      shadowRadius={100}
      flex={1}
      {...props}
    />
  )
}

function preventFormFocusBug(node: any) {
  for (const child of Array.from(document.body.children)) {
    if (child.contains(node)) {
      const preventFormFocusBug = (e) => e.stopPropagation()
      child.addEventListener('mousedown', preventFormFocusBug, true)
    }
  }
}
