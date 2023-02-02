import { ReactNode } from "react";
import {
  BehaviorSubject,
  fromEvent,
  interval,
  merge,
  startWith,
  Subject,
  timer,
} from "rxjs";

import { v4 as uuidV4 } from "uuid";

type OpenModalPayload = { component: ReactNode };
type ModalContent = ReactNode | null;

// Modal
export const modalContentComponent$ = new BehaviorSubject<Array<ModalContent>>(
  []
);
export const openModal$ = new Subject<OpenModalPayload>();
export const closeModal$ = new Subject<true>();

openModal$.subscribe(({ component }) => {
  modalContentComponent$.next(modalContentComponent$.value.concat(component));
});

closeModal$.subscribe(() => {
  if (modalContentComponent$.value.length === 0) return;

  modalContentComponent$.next(
    modalContentComponent$.value.slice(
      0,
      modalContentComponent$.value.length - 1
    )
  );
});

// isDesktop
const DESKTOP_START_WIDTH = 1080;

export const isDesktop$ = new BehaviorSubject(
  window.outerWidth >= DESKTOP_START_WIDTH
);

const checkDesktop = () => {
  const nextValue = window.outerWidth >= DESKTOP_START_WIDTH;
  if (isDesktop$.value !== nextValue) {
    isDesktop$.next(nextValue);
  }
};

merge(interval(500).pipe(startWith(0)), fromEvent(window, "resize")).subscribe(
  checkDesktop
);


export const pushBanner$ = new Subject();
export const removeBanner$ = new Subject();
export const banners$ = new BehaviorSubject([]);

pushBanner$.subscribe(({ key, type, content, duration = 5000 }: any) => {
  // 'key' also can be set before pushing banner.
  const _key = key || `banner-${uuidV4()}`;
  banners$.next([...banners$.value, { key: _key, type, content }] as any);

  timer(duration).subscribe(() => {
    removeBanner$.next({ key: _key });
  });
});

removeBanner$.subscribe(({ key }: any) => {
  const idx = banners$.value.findIndex((a: any) => a.key === key);

  const afterRemove = [
    ...banners$.value.slice(0, idx),
    ...banners$.value.slice(idx + 1),
  ];

  banners$.next(afterRemove);
});