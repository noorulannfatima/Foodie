import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const iconDataSets = {
  set1: [
    { emoji: "🍕", color: "#79071a" },
    { emoji: "🍔", color: "#f43f4e" },
    { emoji: "🍟", color: "#110102" },
    { emoji: "🌮", color: "#750e0e" },
    { emoji: "🍗", color: "#FADBD8" },
  ],
  set2: [
    { emoji: "🌮", color: "#d66969" },
    { emoji: "🥤", color: "#4e0202" },
    { emoji: "☕", color: "#310608" },
    { emoji: "🍿", color: "#8f2e2e" },
    { emoji: "🍔", color: "#851d26" },
  ],
  set3: [
    { emoji: "🍰", color: "#9e190d" },
    { emoji: "🍦", color: "#130101" },
    { emoji: "🍪", color: "#4b0707" },
    { emoji: "🍟", color: "#999292" },
    { emoji: "🍕", color: "#6b1216" },
  ],
};

const ITEM_HEIGHT = 160;
const SCROLL_SPEED = 20; // pixels per second
const GAP = 10; // gap between items from styles

interface SmoothInfiniteScrollProps {
  scrollDirection?: "up" | "down";
  iconSet?: "set1" | "set2" | "set3";
}

const SmoothInfiniteScroll = ({
  scrollDirection = "down",
  iconSet = "set1",
}: SmoothInfiniteScrollProps) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  const iconData = iconDataSets[iconSet];
  const items = [...iconData, ...iconData];
  const totalContentHeight = iconData.length * ITEM_HEIGHT;

  // Calculate total wrap height including gaps between items
  // Each item has a gap after it (except conceptually the last, but we're wrapping)
  const totalWrapHeight = totalContentHeight + iconData.length * GAP;

  useEffect(() => {
    // Calculate duration based on SCROLL_SPEED and total distance
    const duration = (totalWrapHeight / SCROLL_SPEED) * 1000; // convert to milliseconds

    if (scrollDirection === "down") {
      // Start at 0, animate to totalWrapHeight
      scrollY.value = 0;
      scrollY.value = withRepeat(
        withTiming(totalWrapHeight, { duration }),
        -1, // infinite repeats
        false, // don't reverse
      );
    } else {
      // Start at totalWrapHeight, animate to 0
      scrollY.value = totalWrapHeight;
      scrollY.value = withRepeat(
        withTiming(0, { duration }),
        -1, // infinite repeats
        false, // don't reverse
      );
    }
  }, [scrollDirection, totalWrapHeight]);

  useAnimatedReaction(
    () => scrollY.value,
    (y) => {
      if (scrollDirection === "down") {
        if (y >= totalContentHeight) {
          scrollY.value = 0;
          scrollTo(scrollRef, 0, 0, false);
        } else {
          scrollTo(scrollRef, 0, y, false);
        }
      } else {
        if (y <= 0) {
          scrollY.value = totalContentHeight;
          scrollTo(scrollRef, 0, totalContentHeight, false);
        } else {
          scrollTo(scrollRef, 0, y, false);
        }
      }
    },
  );

  return (
    <Animated.ScrollView
      contentContainerStyle={styles.container}
      ref={scrollRef}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      {items.map((item, idx) => (
        <View
          key={idx}
          style={[styles.iconContainer, { backgroundColor: item.color }]}
        >
          <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
        </View>
      ))}
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 20,
  },
  iconContainer: {
    width: 160,
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginHorizontal: 5,
    boxShadow: "0px -2px 10px rgba(0, 0, 0, 0.1)",
  },
});
export default SmoothInfiniteScroll;
