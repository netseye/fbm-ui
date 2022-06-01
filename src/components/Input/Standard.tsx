import React from 'react';
import styled from '@mui/material/styles/styled'
import {
  Input,
  InputProps,
  inputClasses,
} from '@mui/material'

const StandardInput: React.FC<InputProps> = styled(Input)(({ theme, color }) => {
  return {
    backgroundColor: '#FFF',
    [`&:hover:not(.${inputClasses.disabled}):before`]: {
      borderBottom: `1px solid rgba(0,0,0,0.26)`,
    },
    '&:after': {
      borderBottom: `1px solid ${theme.palette[color].main}`,
    },
    '&:before': {
      borderBottom: `1px solid rgba(0,0,0,0.08)`,
    },
  }
})

StandardInput.defaultProps = {
}

export default StandardInput

