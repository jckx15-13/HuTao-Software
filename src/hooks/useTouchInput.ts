import { useEffect, useRef, useState } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export type TouchGestureState = {
  isTouchDevice: boolean;
  isTouching: boolean;
  touchCount: number;
  swipeDirection: SwipeDirection | null;
  pinchScale: number;
};

export type TouchInputOptions = {
  onSwipe?: (direction: SwipeDirection, distance: number) => void;
  onEdgeSwipe?: (edge: 'left' | 'right') => void;
  onPinch?: (scale: number, delta: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  swipeThresholdPx?: number;
  edgeThresholdPx?: number;
  targetRef?: React.RefObject<HTMLElement | null>;
};

export function useTouchInput(options: TouchInputOptions = {}) {
  const {
    onSwipe,
    onEdgeSwipe,
    onPinch,
    onDoubleTap,
    swipeThresholdPx = 40,
    edgeThresholdPx = 30,
    targetRef
  } = options;

  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  });

  const [gestureState, setGestureState] = useState<TouchGestureState>({
    isTouchDevice,
    isTouching: false,
    touchCount: 0,
    swipeDirection: null,
    pinchScale: 1
  });

  const touchStartPosRef = useRef<{ x: number; y: number; time: number; edge: 'left' | 'right' | null } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialPinchDistRef = useRef<number | null>(null);
  const currentPinchScaleRef = useRef<number>(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(hasTouch);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch, { passive: true });
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const target: HTMLElement | Window = targetRef?.current || window;

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      const touches = touchEvent.touches;

      setGestureState((prev) => ({
        ...prev,
        isTouching: true,
        touchCount: touches.length
      }));

      if (touches.length === 1) {
        const touch = touches[0];
        const screenWidth = window.innerWidth;
        let edge: 'left' | 'right' | null = null;

        if (touch.clientX <= edgeThresholdPx) {
          edge = 'left';
        } else if (touch.clientX >= screenWidth - edgeThresholdPx) {
          edge = 'right';
        }

        touchStartPosRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
          edge
        };

        // Check for double tap
        const now = Date.now();
        if (lastTapRef.current) {
          const dt = now - lastTapRef.current.time;
          const dx = Math.abs(touch.clientX - lastTapRef.current.x);
          const dy = Math.abs(touch.clientY - lastTapRef.current.y);
          if (dt < 300 && dx < 30 && dy < 30) {
            onDoubleTap?.(touch.clientX, touch.clientY);
            lastTapRef.current = null;
          } else {
            lastTapRef.current = { x: touch.clientX, y: touch.clientY, time: now };
          }
        } else {
          lastTapRef.current = { x: touch.clientX, y: touch.clientY, time: now };
        }
      } else if (touches.length === 2) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        initialPinchDistRef.current = Math.hypot(dx, dy);
      }
    };

    const handleTouchMove = (e: Event) => {
      const touchEvent = e as TouchEvent;
      const touches = touchEvent.touches;

      if (touches.length === 2 && initialPinchDistRef.current) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        const scale = newDist / initialPinchDistRef.current;
        const delta = scale - currentPinchScaleRef.current;
        currentPinchScaleRef.current = scale;

        setGestureState((prev) => ({ ...prev, pinchScale: scale }));
        onPinch?.(scale, delta);
      }
    };

    const handleTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;

      setGestureState((prev) => ({
        ...prev,
        isTouching: touchEvent.touches.length > 0,
        touchCount: touchEvent.touches.length
      }));

      if (touchStartPosRef.current && touchEvent.changedTouches.length > 0) {
        const touch = touchEvent.changedTouches[0];
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const duration = Date.now() - touchStartPosRef.current.time;

        if (duration < 600) {
          // Check for edge swipe
          if (touchStartPosRef.current.edge) {
            if (touchStartPosRef.current.edge === 'left' && dx > swipeThresholdPx) {
              onEdgeSwipe?.('left');
            } else if (touchStartPosRef.current.edge === 'right' && dx < -swipeThresholdPx) {
              onEdgeSwipe?.('right');
            }
          }

          // General swipe direction detection
          if (Math.max(absX, absY) >= swipeThresholdPx) {
            let dir: SwipeDirection;
            if (absX > absY) {
              dir = dx > 0 ? 'right' : 'left';
            } else {
              dir = dy > 0 ? 'down' : 'up';
            }

            setGestureState((prev) => ({ ...prev, swipeDirection: dir }));
            onSwipe?.(dir, Math.hypot(dx, dy));
          }
        }
      }

      if (touchEvent.touches.length === 0) {
        touchStartPosRef.current = null;
        initialPinchDistRef.current = null;
        currentPinchScaleRef.current = 1;
      }
    };

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchmove', handleTouchMove, { passive: true });
    target.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipe, onEdgeSwipe, onPinch, onDoubleTap, swipeThresholdPx, edgeThresholdPx, targetRef]);

  return gestureState;
}
