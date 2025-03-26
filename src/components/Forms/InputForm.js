import React from 'react';
import { View } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';

const InputForm = ({
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  onSubmitEditing,
  mode = 'outlined',
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  leftIcon,
  rightIcon,
  error,
  helper,
  disabled = false,
  className = '',
  placeholder,
  multiline = false,
  numberOfLines,
  style,
  touched,
  height,
  ...rest
}) => {
  const getKeyboardType = (inputType) => {
    switch (inputType) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      case 'phone':
        return 'phone-pad';
      default:
        return keyboardType;
    }
  };

  const renderInput = () => {
    const baseProps = {
      label,
      value,
      onChangeText: onChange,
      onBlur,
      onSubmitEditing,
      mode,
      autoCapitalize,
      keyboardType: getKeyboardType(type),
      disabled,
      error: touched && error ? true : !!error,
      placeholder,
      multiline,
      numberOfLines,
      style: height ? [{ height }, style] : style,
      ...(leftIcon && { left: leftIcon }),
      ...(rightIcon && { right: rightIcon }),
      ...rest
    };

    switch (type) {
      case 'password':
        return (
          <TextInput
            {...baseProps}
            secureTextEntry={secureTextEntry !== false}
          />
        );
      case 'email':
        return (
          <TextInput
            {...baseProps}
            autoComplete="email"
            textContentType="emailAddress"
          />
        );
      case 'phone':
        return (
          <TextInput
            {...baseProps}
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
        );
      case 'search':
        return (
          <TextInput
            {...baseProps}
            autoComplete="off"
            clearButtonMode="while-editing"
          />
        );
      case 'textarea':
        return (
          <TextInput
            {...baseProps}
            multiline={true}
            numberOfLines={numberOfLines || 4}
            style={[{ textAlignVertical: 'top' }, baseProps.style]}
          />
        );
      default:
        return <TextInput {...baseProps} />;
    }
  };

  const showError = touched ? error : error && typeof error === 'string';
  const showHelper = !showError && helper;

  return (
    <View className={`${className}`} style={style}>
      {renderInput()}
      {(showError || showHelper) && (
        <HelperText 
          type={showError ? "error" : "info"} 
          visible={true} 
          className="text-xs"
        >
          {showError || showHelper}
        </HelperText>
      )}
    </View>
  );
};

export default InputForm;