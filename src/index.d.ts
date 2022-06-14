declare module 'react-native-smooth-pincode-input' {
    import { Component, ReactElement } from 'react';
    import { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';
    type SmoothPinCodeInputProps = {
      value?: string;
      codeLength?: number;
      cellSize?: number;
      cellSpacing?: number;
      placeholder?: string | ReactElement;
      mask?: string | ReactElement;
      maskDelay?: number;
      password?: boolean;
      autoFocus?: boolean;
      restrictToNumbers?: boolean;
      containerStyle?: StyleProp<ViewStyle>;
      cellStyle?: StyleProp<ViewStyle>;
      cellStyleFocused?: StyleProp<ViewStyle>;
      cellStyleFilled?: StyleProp<ViewStyle>;
      textStyle?: StyleProp<TextStyle>;
      textStyleFocused?: StyleProp<TextStyle>;
      animated?: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      animationFocused?: string | any;
      onFulfill?: (value: string) => void;
      onChangeText?: TextInputProps['onChangeText'];
      onBackspace?: () => void;
      onTextChange?: TextInputProps['onChangeText'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      testID?: any;
      onFocus?: TextInputProps['onFocus'];
      onBlur?: TextInputProps['onBlur'];
      keyboardType?: string;
      editable?: boolean;
      inputProps?: TextInputProps;
    };
  
    type SmoothInputSate = {
      maskDelay: boolean;
      focused: boolean;
    };
  
    export default class SmoothPinCodeInput extends Component<SmoothPinCodeInputProps, SmoothInputSate> {}
  }
  