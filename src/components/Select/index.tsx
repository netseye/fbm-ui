
import React, { useMemo } from 'react';
import { Select as MuiSelect, Box, selectClasses, MenuItem, styled } from '@mui/material'
import type { SelectProps as MuiSelectProps, MenuItemProps } from '@mui/material'

import Input from '../Input'
import { ArrowDropDownIcon, DoneIcon } from '../icons'
import Chip from '../Chip'
import Checkbox from '../Checkbox';

type OptionMap = {
  label: string;
  value: MenuItemProps['value'],
}

export interface SelectProps extends MuiSelectProps {
  name?: string;
  options?: OptionMap[];
}

const SelectRoot = styled(MuiSelect)(({ size, disabled }: SelectProps) => {
  return {
    [`& .${selectClasses.icon}`]: {
      color: 'rgba(0, 0, 0, 0.56)'
    },
    ...(disabled && {
      [`& .${selectClasses.icon}`]: {
        color: 'rgba(0, 0, 0, 0.26)'
      },
    }),
    [`& .${selectClasses.select}`]: {
      ...(size === 'small') && {
        padding: '6.5px 12px 6.5px 12px',
      },
      ...(size === 'large') && {
        padding: '12.5px 12px 12.5px 12px',
      }
    },
  }
})

const MenuItemRoot = styled(MenuItem)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&.Mui-selected': {
    background: '#fff',
    '&:hover': {
      background: 'rgba(0,0,0,.04)',
    },
  },
})

const LabelRoot = styled(Box)({
  flex: 1,
})

const Select: React.FC<SelectProps> = React.forwardRef((props, ref) => {
  const {
    label,
    value: valueProp,
    children: childrenProp,
    options,
    ...SelectProps
  } = props

  const children = useMemo(() => {
    if (childrenProp != null) return childrenProp;
    if (SelectProps.multiple) {
      return options.map(({ label, value }) => (
        <MenuItemRoot key={`${value}-${label}`} value={value} sx={{ justifyContent: "flex-start" }}>
          <Checkbox label={label} checked={Array.isArray(valueProp) && valueProp.includes(value)} />
        </MenuItemRoot>
      ));
    }
    return options.map(({ label, value }) => (
      <MenuItemRoot key={`${value}-${label}`} value={value}>
        <LabelRoot>{label || value}</LabelRoot>
        {Array.isArray(valueProp)
          ? valueProp.includes(value) && <DoneIcon color="primary" />
          : value === valueProp && <DoneIcon color="primary" />}
      </MenuItemRoot>
    ));
  }, [options, childrenProp, valueProp]);

  const optionMaps = useMemo(() => {
    const _maps = {};

    for (let i = 0; i < options?.length; i++) {
      const { value, label } = options[i]
      _maps[value as string] = label
    }

    return _maps
  }, [options])


  return (
    <SelectRoot
      ref={ref}
      value={valueProp}
      input={<Input label={label} />}
      renderValue={(value) => {
        if (Array.isArray(value)) {
          return (
            <Box sx={{ margin: SelectProps.size !== "small" ? '-5px 3px -5px 0px' : '-1px 3px -1px 0px' }}>
              {value?.map((v) => <Chip sx={{ mr: '3px' }} size={SelectProps.size === "small" ? 'medium' : 'large'} label={optionMaps[v]} />)}
            </Box>
          )
        }
        return optionMaps[value as string]
      }}
      {...SelectProps}
    >
      {children}
    </SelectRoot>
  )
})

Select.defaultProps = {
  options: [],
  IconComponent: ArrowDropDownIcon,
  fullWidth: true,
}

export default Select