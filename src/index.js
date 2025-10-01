import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    I18nManager,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const styles = StyleSheet.create({
  containerDefault: {},
  cellDefault: {
    borderColor: 'gray',
    borderWidth: 1,
  },
  cellFocusedDefault: {
    borderColor: 'black',
    borderWidth: 2,
  },
  textStyleDefault: {
    color: 'gray',
    fontSize: 24,
  },
  textStyleFocusedDefault: {
    color: 'black',
  },
});

const SmoothPinCodeInput = React.forwardRef((props, forwardedRef) => {
  const [maskDelay, setMaskDelay] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef();
  const maskTimeoutRef = useRef();

  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const {
    value = '',
    codeLength = 4,
    cellSize = 48,
    cellSpacing = 4,
    placeholder = '',
    password = false,
    mask = '*',
    autoFocus = false,
    containerStyle = styles.containerDefault,
    cellStyle = styles.cellDefault,
    cellStyleFocused = styles.cellFocusedDefault,
    cellStyleFilled,
    textStyle = styles.textStyleDefault,
    textStyleFocused = styles.textStyleFocusedDefault,
    keyboardType = 'numeric',
    animated = true,
    testID,
    editable = true,
    inputProps = {},
    disableFullscreenUI = true,
    restrictToNumbers = false,
    maskDelay: maskDelayProp = 200,
    onTextChange,
    onFulfill,
    onBackspace,
    onFocus,
    onBlur,
  } = props;

  const startPulse = useCallback(() => {
    cancelAnimation(scale);
    scale.value = 1;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 250, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 250, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [scale]);

  const stopPulse = useCallback(() => {
    cancelAnimation(scale);
    scale.value = 1;
  }, [scale]);

  useEffect(() => {
    const shouldPulse = animated && focused;
    if (shouldPulse) {
      startPulse();
    } else {
      stopPulse();
    }
    return () => {
      stopPulse();
    };
  }, [animated, focused, startPulse, stopPulse]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animate = useCallback(({ animation = 'shake', duration = 650 } = {}) => {
    if (!animated) {
      return Promise.reject(new Error('Animations are disabled'));
    }
    if (animation !== 'shake') {
      return Promise.reject(new Error('Unknown animation'));
    }
    const amplitude = 8;
    return new Promise((resolve) => {
      translateX.value = withSequence(
        withTiming(-amplitude, { duration: Math.max(1, Math.floor(duration * 0.1)), easing: Easing.linear }),
        withRepeat(
          withSequence(
            withTiming(amplitude, { duration: Math.max(1, Math.floor(duration * 0.1)), easing: Easing.linear }),
            withTiming(-amplitude, { duration: Math.max(1, Math.floor(duration * 0.1)), easing: Easing.linear })
          ),
          3,
          true
        ),
        withTiming(0, { duration: Math.max(1, Math.floor(duration * 0.1)), easing: Easing.linear }, () => {
          runOnJS(resolve)();
        })
      );
    });
  }, [animated, translateX]);

  const shake = useCallback(() => animate({ animation: 'shake' }), [animate]);

  const focus = useCallback(() => inputRef.current && inputRef.current.focus(), []);
  const blur = useCallback(() => inputRef.current && inputRef.current.blur(), []);
  const clear = useCallback(() => inputRef.current && inputRef.current.clear(), []);

  useImperativeHandle(forwardedRef, () => ({
    animate,
    shake,
    focus,
    blur,
    clear,
  }));

  const inputCode = useCallback((code) => {
    const localCodeLength = codeLength || 4;
    if (restrictToNumbers) {
      code = (code.match(/[0-9]/g) || []).join('');
    }
    if (onTextChange) {
      onTextChange(code);
    }
    if (code.length === localCodeLength && onFulfill) {
      onFulfill(code);
    }

    const delayMask = password && code.length > (value || '').length;
    setMaskDelay(delayMask);
    if (delayMask) {
      clearTimeout(maskTimeoutRef.current);
      maskTimeoutRef.current = setTimeout(() => {
        setMaskDelay(false);
      }, maskDelayProp);
    }
  }, [codeLength, restrictToNumbers, onTextChange, onFulfill, password, value, maskDelayProp]);

  const keyPress = useCallback((event) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (value === '' && onBackspace) {
        onBackspace();
      }
    }
  }, [value, onBackspace]);

  const onFocused = useCallback(() => {
    setFocused(true);
    if (typeof onFocus === 'function') {
      onFocus();
    }
  }, [onFocus]);

  const onBlurred = useCallback(() => {
    setFocused(false);
    if (typeof onBlur === 'function') {
      onBlur();
    }
  }, [onBlur]);

  useEffect(() => {
    return () => {
      clearTimeout(maskTimeoutRef.current);
      cancelAnimation(scale);
      cancelAnimation(translateX);
    };
  }, [scale, translateX]);

  return (
    <Animated.View
      style={[{
        alignItems: 'stretch', flexDirection: 'row', justifyContent: 'center', position: 'relative',
        width: cellSize * codeLength + cellSpacing * (codeLength - 1),
        height: cellSize,
      },
        containerStyle,
        containerAnimatedStyle,
      ]}>
      <View style={{
        position: 'absolute', margin: 0, height: '100%',
        flexDirection: I18nManager.isRTL ? 'row-reverse': 'row',
        alignItems: 'center',
      }}>
        {
          Array.apply(null, Array(codeLength)).map((_, idx) => {
            const cellFocusedLocal = focused && idx === value.length;
            const filled = idx < value.length;
            const last = (idx === value.length - 1);
            const showMask = filled && (password && (!maskDelay || !last));
            const isPlaceholderText = typeof placeholder === 'string';
            const isMaskText = typeof mask === 'string';
            const pinCodeChar = value.charAt(idx);

            let cellText = null;
            if (filled || placeholder !== null) {
              if (showMask && isMaskText) {
                cellText = mask;
              } else if(!filled && isPlaceholderText) {
                cellText = placeholder;
              } else if (pinCodeChar) {
                cellText = pinCodeChar;
              }
            }

            const placeholderComponent = !isPlaceholderText ? placeholder : null;
            const maskComponent = (showMask && !isMaskText) ? mask : null;
            const isCellText = typeof cellText === 'string';

            const shouldPulseThisCell = (idx === value.length) && focused && animated;

            return (
              <Animated.View
                key={idx}
                style={[
                  {
                    width: cellSize,
                    height: cellSize,
                    marginLeft: cellSpacing / 2,
                    marginRight: cellSpacing / 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  cellStyle,
                  cellFocusedLocal ? cellStyleFocused : {},
                  filled ? cellStyleFilled : {},
                  shouldPulseThisCell ? pulseAnimatedStyle : {},
                ]}
              >
                {isCellText && !maskComponent && <Text style={[textStyle, cellFocusedLocal ? textStyleFocused : {}]}>
                  {cellText}
                </Text>}

                {(!isCellText && !maskComponent) && placeholderComponent}
                {isCellText && maskComponent}
              </Animated.View>
            );
          })
        }
      </View>
      <TextInput
        disableFullscreenUI={disableFullscreenUI}
        value={value}
        ref={inputRef}
        onChangeText={inputCode}
        onKeyPress={keyPress}
        onFocus={onFocused}
        onBlur={onBlurred}
        spellCheck={false}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        numberOfLines={1}
        caretHidden
        maxLength={codeLength}
        selection={{
          start: value.length,
          end: value.length,
        }}
        style={{
          flex: 1,
          opacity: 0,
          textAlign: 'center',
        }}
        testID={testID || undefined}
        editable={editable}
        {...inputProps} />
    </Animated.View>
  );
});

export default SmoothPinCodeInput;


