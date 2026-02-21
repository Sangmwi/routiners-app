import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useComponentTheme } from '@/lib/theme';

type ModalPresentation = 'sheet' | 'dialog';

interface BaseSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  presentation?: ModalPresentation;
  animationDuration?: number;
  closeOnBackdropPress?: boolean;
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
  contentStyle,
  overlayStyle,
}: BaseSheetModalProps) {
  const theme = useComponentTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      const enterAnimations: Animated.CompositeAnimation[] = [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ];

      if (presentation === 'sheet') {
        enterAnimations.push(
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: animationDuration,
            useNativeDriver: true,
          }),
        );
      } else {
        enterAnimations.push(
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
        );
      }

      Animated.parallel(enterAnimations).start();
      return;
    }

    const exitAnimations: Animated.CompositeAnimation[] = [
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ];

    if (presentation === 'sheet') {
      exitAnimations.push(
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      );
    } else {
      exitAnimations.push(
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      );
    }

    Animated.parallel(exitAnimations).start();
  }, [animationDuration, fadeAnim, presentation, scaleAnim, slideAnim, visible]);

  const overlayPlacement =
    presentation === 'sheet' ? styles.overlayBottom : styles.overlayCenter;

  const contentTransform =
    presentation === 'sheet'
      ? { transform: [{ translateY: slideAnim }] }
      : { transform: [{ scale: scaleAnim }] };

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.overlay,
            overlayPlacement,
            { backgroundColor: theme.overlay, opacity: fadeAnim },
            overlayStyle,
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View style={[contentTransform, contentStyle]}>
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
