import React, { useState, useCallback, useRef, useTransition, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import { showToast } from './Toast';

/**
 * Self-contained LikeButton with optimistic UI.
 *
 *   <LikeButton
 *     postId={report._id}
 *     initialCount={report.upvotes || 0}
 *     initialLiked={report.upvotedBy?.includes(userId)}
 *   />
 *
 * - Instantly toggles like state + count on click (optimistic)
 * - Fires API in the background; reverts on failure
 * - Debounces rapid clicks (300ms)
 * - Upvote digit animates with a ticker slide effect
 */

// ─── Animated digit ticker ──────────────────────────────
function AnimatedCount({ value }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [direction, setDirection] = useState(null); // 'up' | 'down' | null
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setDirection(value > prevValue.current ? 'up' : 'down');
      // Small delay to allow exit animation frame
      const t = setTimeout(() => {
        setDisplayValue(value);
        prevValue.current = value;
      }, 20);
      return () => clearTimeout(t);
    }
  }, [value]);

  // Reset direction after animation completes
  useEffect(() => {
    if (direction) {
      const t = setTimeout(() => setDirection(null), 280);
      return () => clearTimeout(t);
    }
  }, [direction, displayValue]);

  return (
    <span
      className="like-btn-count"
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        height: '1.2em',
        lineHeight: '1.2em',
        position: 'relative',
        minWidth: '1ch',
        textAlign: 'center',
      }}
    >
      <span
        key={displayValue}
        className={
          direction === 'up'
            ? 'ticker-enter-up'
            : direction === 'down'
            ? 'ticker-enter-down'
            : ''
        }
        style={{
          display: 'inline-block',
        }}
      >
        {displayValue}
      </span>
    </span>
  );
}

// ─── Main LikeButton component ──────────────────────────
const LikeButton = React.memo(function LikeButton({
  postId,
  initialCount = 0,
  initialLiked = false,
  disabled = false,
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef(null);
  const inflightRef = useRef(false);

  // Sync with parent if props change (e.g. pagination)
  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (disabled || inflightRef.current) return;

      // Debounce rapid clicks
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Optimistic update — immediate
      const wasLiked = liked;
      const prevCount = count;
      setLiked(!wasLiked);
      setCount(wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

      debounceRef.current = setTimeout(() => {
        inflightRef.current = true;

        startTransition(() => {
          reportsAPI
            .upvote(postId)
            .then((data) => {
              // Sync with server truth
              if (data.upvotes !== undefined) {
                setCount(data.upvotes);
              }
              if (data.hasUpvoted !== undefined) {
                setLiked(data.hasUpvoted);
              }
            })
            .catch(() => {
              // Revert on failure
              setLiked(wasLiked);
              setCount(prevCount);
              showToast('Failed to update vote. Please try again.', 'error');
            })
            .finally(() => {
              inflightRef.current = false;
            });
        });
      }, 300);
    },
    [liked, count, postId, disabled],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={liked ? 'Remove upvote' : 'Upvote this report'}
      aria-pressed={liked}
      className={`like-btn ${liked ? 'like-btn--active' : ''} ${isPending ? 'like-btn--pending' : ''}`}
    >
      {/* Thumb icon with pop animation */}
      <span className={`like-btn-icon ${liked ? 'like-btn-icon--pop' : ''}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
      </span>
      <AnimatedCount value={count} />
      {isPending && (
        <span className="like-btn-spinner" aria-hidden="true" />
      )}
    </button>
  );
});

export default LikeButton;
