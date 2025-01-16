import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

const NewReleasesScreen = () => {
  return (
    <View style={styles.container}>
      <Text>New Releases Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NewReleasesScreen; 