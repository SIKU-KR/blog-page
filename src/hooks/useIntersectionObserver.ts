import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
    threshold?: number;
    root?: Element | null;
    rootMargin?: string;
    onIntersect?: () => void;
    enabled?: boolean;
}

export function useIntersectionObserver({
    threshold = 0,
    root = null,
    rootMargin = '0px',
    onIntersect,
    enabled = true,
}: UseIntersectionObserverProps) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && onIntersect) {
                        onIntersect();
                    }
                });
            },
            {
                threshold,
                root,
                rootMargin,
            }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [threshold, root, rootMargin, onIntersect, enabled]);

    return ref;
}
