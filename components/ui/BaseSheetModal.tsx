import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { THEME_TOKENS } from '@sauhi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';

type ModalPresentation = 'sheet' | 'dialog';

interface BaseSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  presentation?: ModalPresentation;
  animationDuration?: number;
  closeOnBackdropPress?: boolean;
  backdropBlur?: boolean;
  backdropIntensity?: number;
  dialogAnimation?: 'fade' | 'none';
  contentStyle?: StyleProp<ViewStyle>;
  overlayStyle?: StyleProp<ViewStyle>;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function BaseSheetModal({
  visible,
  onClose,
  children,
  presentation = 'sheet',
  animationDuration = 250,
  closeOnBackdropPress = true,
  backdropBlur = true,
  backdropIntensity = THEME_TOKENS.layout.modal.blurIntensity,
  dialogAnimation = 'fade',
  contentStyle,
  overlayStyle,
}: BaseSheetModalProps) {
  const theme = useComponentTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const hasStartedEnterRef = useRef(false);
  const deferEnterUntilOnShow = Platform.OS === 'android' && presentation === 'dialog';

  const resetAnimatedState = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(SCREEN_HEIGHT);
    hasStartedEnterRef.current = false;
  }, [fadeAnim, slideAnim]);

  const startEnterAnimation = useCallback(() => {
    if (hasStartedEnterRef.current) {
      return;
    }

    hasStartedEnterRef.current = true;

    fadeAnim.setValue(0);

    const enterAnimations: Animated.CompositeAnimation[] = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    if (presentation === 'sheet') {
      slideAnim.setValue(SCREEN_HEIGHT);
      enterAnimations.push(
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: animationDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      );
    }

    Animated.parallel(enterAnimations).start();
  }, [animationDuration, fadeAnim, presentation, slideAnim]);

  useEffect(() => {
    if (!visible) {
      resetAnimatedState();
      return;
    }

    if (!deferEnterUntilOnShow) {
      startEnterAnimation();
    }
  }, [deferEnterUntilOnShow, resetAnimatedState, startEnterAnimation, visible]);

  const overlayPlacement =
    presentation === 'sheet' ? styles.overlayBottom : styles.overlayCenter;

  const contentTransform =
    presentation === 'sheet'
      ? { transform: [{ translateY: slideAnim }] }
      : dialogAnimation === 'none'
        ? { opacity: 1 }
        : { opacity: fadeAnim };

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  const handleModalShow = () => {
    if (deferEnterUntilOnShow && visible) {
      startEnterAnimation();
    }
  };

  const shouldRenderBlur = backdropBlur;
  const useTranslucentSystemBars = Platform.OS === 'android' && presentation === 'sheet';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={handleModalShow}
      statusBarTranslucent={useTranslucentSystemBars}
      navigationBarTranslucent={useTranslucentSystemBars}
      hardwareAccelerated={Platform.OS === 'android'}
      onRequestClose={onClose}
    >
      <View style={styles.modalHost}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            style={[
              styles.overlay,
              overlayPlacement,
              { opacity: fadeAnim },
            ]}
          >
            {shouldRenderBlur ? (
              <BlurView
                intensity={backdropIntensity}
                tint={theme.isDark ? 'dark' : 'light'}
                experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                style={styles.absoluteFill}
              />
            ) : null}
            <View
              style={[
                styles.absoluteFill,
                { backgroundColor: theme.overlay },
                overlayStyle,
              ]}
            />

            <TouchableWithoutFeedback>
              <Animated.View style={[contentTransform, contentStyle]}>
                {children}
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalHost: {
    flex: 1,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
  },
  overlayBottom: {
    justifyContent: 'flex-end',
  },
  overlayCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
