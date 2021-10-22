import * as React from 'react';
import { Alert, AlertProps } from '@material-ui/core'
import styled from '@material-ui/core/styles/styled'
import useThemeProps from '@material-ui/core/styles/useThemeProps'

import Aicon from '../Icon'

const componentName: string = 'Aalert'

type AlertType = 'error' | 'warning' | 'success' | 'info'

export interface AalertProps extends AlertProps {
  /** Alert类型 可选 默认为info */
  type?: AlertType;
  /** Alert显示内容 */
  children?: React.ReactNode,
   /** 提示文案 */
  message?:React.ReactNode, 
}

const AlertRoot: React.FC<AalertProps> = styled(Alert, {
  name: 'Aalert',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const { type } = props
    return [styles.root, styles[type]]
  },
})(() => ({}))


const Aalert: React.FC<AalertProps> = (inProps) => {
  const {
    type,
    children,
    message,
    icon,
    color: componentColor,
    ...otherProps
  } = useThemeProps({ props: inProps, name: componentName })

  const Icon = () => {
    if (icon === null) return null

    if (icon === undefined) {
      const typeIcons = {
        success: 'CheckIcon',
        error: 'ErrorIcon',
        warning: 'WarningIcon',
        info: 'InfoIcon',
      }
      if (typeIcons[type]) {
        const name = typeIcons[type]
        return <Aicon name={name} />
      }
    }

    if (typeof icon === 'string') {
      return <Aicon name={icon} />
    }
  }

  const color = componentColor || type

  return (
    <AlertRoot 
      color={color}
      icon={<Icon />} 
      type={type} 
      {...otherProps}
    >
      {message || children}
    </AlertRoot>
  )
}

export default Aalert
