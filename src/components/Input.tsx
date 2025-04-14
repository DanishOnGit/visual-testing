import React, { ChangeEvent } from 'react';
import { Box, Text } from '@razorpay/blade/components';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  errorText?: string;
}

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  isDisabled = false,
  isRequired = false,
  errorText
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Box>
      {label && (
        <Text>
          {label}{isRequired && ' *'}
        </Text>
      )}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={isDisabled}
        required={isRequired}
        className="blade-input"
      />
      {errorText && (
        <Text>
          {errorText}
        </Text>
      )}
    </Box>
  );
};

export default Input; 