import React from 'react';
import {
  IconButton,
} from '@mui/material'
import styled from '@mui/material/styles/styled'

import Outlined, { FbmOutlinedProps } from './Outlined'
import Standard, { FbmStandardProps } from './Standard'
import Calendar from '../Calendar'
import { CloseIcon } from '../icons'
import { isFunction } from '../../utils'

const variantComponent = {
  standard: Standard,
  outlined: Outlined,
  calendar: Calendar
};

export interface BaseInputProps {
  clear?: boolean;
  onClear?: () => void;
  variant?: string;
}

export type InputProps = BaseInputProps & FbmOutlinedProps & FbmStandardProps

const EndButton = styled(IconButton)({
  padding: 3,
  '& svg': {
    fontSize: '16px !important'
  }
})

const FbmInput: React.FC<InputProps> = React.forwardRef((props, ref) => {
  const {
    value,
    variant,
    clear,
    onClear,
    ...InputProps
  } = props

  const handleClear = (e) => {
    e.stopPropagation()
    if (isFunction(onClear)) {
      onClear()
    }
  }

  const InputComponent = variantComponent[variant]
  const ClearEndAdornment = () => {
    if (value && (clear || onClear)) {
      return (
        <EndButton size='small' onClick={handleClear}>
          <CloseIcon />
        </EndButton>
      )
    }
    return null
  }

  return (
    <InputComponent
      ref={ref}
      value={value}
      endAdornment={<ClearEndAdornment />}
      {...InputProps}
    />
  )
})

FbmInput.defaultProps = {
  variant: 'outlined',
  fullWidth: true,
}

export default FbmInput

