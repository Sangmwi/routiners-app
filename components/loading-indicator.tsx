import { ActivityIndicator, StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export const LoadingIndicator = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#4A90D9" />
  </View>
);

