import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { breakpoints, negativeSpacings, spacings } from "../constants/design";
import { useFirstMountState } from "../hooks/useFirstMountState";
import { useResponsive } from "../hooks/useResponsive";
import { clampValue } from "../utils/math";
import { LakeButton } from "./LakeButton";
import { LakeRadio } from "./LakeRadio";
import { Pressable } from "./Pressable";
import { Space } from "./Space";
import { Tile } from "./Tile";

const ELASTIC_LENGTH = 60; // the maximum value you can reach
const ELASTIC_STRENGTH = 0.008; // higher value, maximum value reached faster

const CHANGE_INDEX_TILE_PERCENTAGE = 0.5; // between 0 and 1, lower value, more sensitive
const SWIPE_VELOCITY = 0.5; // higher value, less sensitive

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    alignItems: "stretch",
    flexGrow: 1,
    overflow: "hidden",
    marginHorizontal: negativeSpacings[12],
  },
  container: {
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    justifyContent: "center",
  },
  mobileContainer: {
    flexWrap: "nowrap",
    justifyContent: "flex-start",
    transitionProperty: "transform",
    transitionDuration: "300ms",
    transitionTimingFunction: "ease-in-out",
  },
  item: {
    flexGrow: 0,
    flexBasis: "33.333%",
    maxWidth: 300,
    padding: spacings[12],
    transform: "translateZ(0px)",
    animationKeyframes: {
      from: {
        opacity: 0,
        transform: "translateZ(0px) translateX(50px)",
      },
      to: {
        opacity: 1,
        transform: "translateZ(0px) translateX(0px)",
      },
    },
    animationDuration: "200ms",
    animationFillMode: "backwards",
    animationTimingFunction: "ease-in-out",
  },
  itemLarge: {
    flexBasis: "50%",
    maxWidth: "none",
  },
  itemSmallViewport: {
    width: "100%",
    flexBasis: "auto",
    maxWidth: "none",
  },
  tileContents: {
    alignItems: "center",
    alignSelf: "stretch",
    flexGrow: 1,
  },
  tileRenderedContents: {
    alignItems: "center",
    alignSelf: "stretch",
    flexGrow: 1,
  },
  leftButton: {
    position: "absolute",
    top: "50%",
    left: negativeSpacings[24],
    transform: "translateY(-50%)",
  },
  rightButton: {
    position: "absolute",
    top: "50%",
    right: negativeSpacings[24],
    transform: "translateY(-50%)",
  },
});

type Props<T> = {
  items: T[];
  large?: boolean;
  renderItem: (value: T) => ReactNode;
  value?: T;
  getId?: (item: T) => unknown;
  onChange: (value: T) => void;
};

const identity = <T,>(x: T) => x;

export const ChoicePicker = <T,>({
  items,
  getId = identity,
  large = false,
  renderItem,
  value,
  onChange,
}: Props<T>) => {
  const isFirstMount = useFirstMountState();
  const { desktop } = useResponsive(breakpoints.medium);
  const [index, setIndex] = useState(0);

  const panStartIndex = useRef(index);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => !desktop,
        onPanResponderGrant: event => {
          // @ts-expect-error
          const target: HTMLElement = event.currentTarget;

          panStartIndex.current = index;
          target.style.transitionDuration = "0ms";
        },
        onPanResponderMove: (event, gestureState) => {
          // @ts-expect-error
          const target: HTMLElement = event.currentTarget;
          const width = target.offsetWidth;
          const translateX = -width * panStartIndex.current + gestureState.dx;
          const minTranslate = -width * (items.length - 1);

          const leftOverflow = Math.max(translateX, 0);
          const elasticLeftOffset =
            ELASTIC_LENGTH * (1 - Math.exp(-ELASTIC_STRENGTH * leftOverflow));

          const rightOverflow = -Math.min(translateX - minTranslate, 0);
          const elasticRightOffset =
            ELASTIC_LENGTH * (1 - Math.exp(-ELASTIC_STRENGTH * rightOverflow));

          const clampedTranslateX = clampValue(minTranslate, 0)(translateX);
          const finalTranslateX = clampedTranslateX + elasticLeftOffset - elasticRightOffset;

          target.style.transform = `translateX(${finalTranslateX}px)`;
        },
        onPanResponderRelease: (event, gestureState) => {
          // @ts-expect-error
          const target: HTMLElement = event.currentTarget;
          const width = target.offsetWidth;

          const decrementIndex =
            gestureState.dx > width * CHANGE_INDEX_TILE_PERCENTAGE ||
            gestureState.vx > SWIPE_VELOCITY;
          const incrementIndex =
            gestureState.dx < -width * CHANGE_INDEX_TILE_PERCENTAGE ||
            gestureState.vx < -SWIPE_VELOCITY;

          const newIndex = decrementIndex
            ? Math.max(0, panStartIndex.current - 1)
            : incrementIndex
            ? Math.min(items.length - 1, panStartIndex.current + 1)
            : panStartIndex.current;

          setIndex(newIndex);
          const newItem = items[newIndex];
          if (newIndex !== panStartIndex.current && newItem != null) {
            onChange(newItem);
          }

          // @ts-expect-error
          target.style.transitionDuration = null;
          target.style.transform = `translateX(-${100 * newIndex}%)`;
        },
      }),
    [desktop, index, items, onChange],
  );

  // On mobile, we select by default the first item
  useEffect(() => {
    if (isFirstMount && !desktop && value == null && items[0] != null) {
      onChange(items[0]);
    }
  }, [isFirstMount, desktop, value, items, onChange]);

  return (
    <View>
      <View style={styles.root}>
        <View
          {...panResponder.panHandlers}
          style={[
            styles.container,
            !desktop && styles.mobileContainer,
            !desktop && { transform: `translateX(-${100 * index}%)` },
          ]}
        >
          {items.map((item, index) => (
            <Pressable
              key={String(index)}
              style={[
                styles.item,
                large && styles.itemLarge,
                !desktop && styles.itemSmallViewport,
                { animationDelay: `${200 + 100 * index}ms` },
              ]}
              onPress={() => onChange(item)}
            >
              {({ hovered }) => (
                <Tile
                  hovered={hovered}
                  selected={value != null && getId(item) === getId(value)}
                  flexGrow={1}
                >
                  <View style={styles.tileContents}>
                    <View style={styles.tileRenderedContents}>{renderItem(item)}</View>
                    <Space height={24} />
                    <LakeRadio value={value != null && getId(item) === getId(value)} />
                  </View>
                </Tile>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {!desktop && (
        <View style={styles.leftButton}>
          <LakeButton
            icon="chevron-left-filled"
            mode="secondary"
            forceBackground={true}
            onPress={() => {
              const newIndex = Math.max(0, index - 1);
              setIndex(newIndex);

              const newItem = items[newIndex];
              if (newItem != null) {
                onChange(newItem);
              }
            }}
            disabled={index === 0}
          />
        </View>
      )}

      {!desktop && (
        <View style={styles.rightButton}>
          <LakeButton
            icon="chevron-right-filled"
            mode="secondary"
            forceBackground={true}
            onPress={() => {
              const newIndex = Math.min(items.length - 1, index + 1);
              setIndex(newIndex);

              const newItem = items[newIndex];
              if (newItem != null) {
                onChange(newItem);
              }
            }}
            disabled={index === items.length - 1}
          />
        </View>
      )}
    </View>
  );
};
