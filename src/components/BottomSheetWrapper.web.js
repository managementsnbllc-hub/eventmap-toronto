// Web: simple fallback for @gorhom/bottom-sheet
import React, { forwardRef } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';

const BottomSheet = forwardRef(function BottomSheet(
  { children, backgroundStyle, index, snapPoints, handleIndicatorStyle, enablePanDownToClose, ...rest },
  ref,
) {
  return (
    <View style={[styles.container, backgroundStyle]}>
      {/* Drag handle visual (non-functional on web) */}
      <View style={styles.handleBar}>
        <View style={[styles.handle, handleIndicatorStyle]} />
      </View>
      {children}
    </View>
  );
});

// Expose snapToIndex as a no-op so callers don't crash
BottomSheet.snapToIndex = () => {};

export const BottomSheetFlatList = FlatList;
export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    maxHeight: 420,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
});
