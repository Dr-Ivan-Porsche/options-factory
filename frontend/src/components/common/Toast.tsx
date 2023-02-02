import React, { Component } from "react";
import { Subject, merge } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { twMerge, join } from 'tailwind-merge'

import { banners$, removeBanner$ } from "../../streams/ui";

class Toast extends Component {
  destroy$ = new Subject();

  componentDidMount() {
    merge(banners$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.forceUpdate();
      });
  }

  componentWillUnmount() {
    this.destroy$.next(true);
  }

  render() {
    return (
      banners$.value &&
      banners$.value.map(({ key, type, content }, idx) => {
        const TOP_OFFSET = 15;

        return (
          <div
            key={key}
            style={{
              top:
                TOP_OFFSET * (banners$.value.length - idx) +
                60 * (banners$.value.length - idx - 1),
            }}
            className={join(
              "fixed left-[50%] translate-x-[-50%] z-[9999]",
              "flex",
              "items-center justify-center",
              "text-center",
              "w-[480px] h-[64px] max-w-[400px]",
              "border border-1 border-[#334040]",
              "bg-darkgray",
              "rounded-[8px]",
              "shadow-[0_2px_8px_0_rgba(0,0,0,0.75)]",
              "animate-toast-appear",
              type ? "" : "",
            )}
          >
            {type === 'success' 
              ? (
                <img
                  className={join(
                    "absolute",
                    "left-[22px] top-[50%] translate-y-[-50%]",
                    "w-[20px] h-[20px]",
                  )}
                  src="/assets/images/toast-success.svg" 
                />
              )
              : (
                <img
                  className={join(
                    "absolute",
                    "left-[22px] top-[50%] translate-y-[-50%]",
                    "w-[20px] h-[20px]",
                  )}
                  src="/assets/images/toast-failed.svg" 
                />
              )
            }
            <p
              className={join(
                "text-[16px] font-semibold text-gray text-center",
              )}
            >
              {content}
            </p>
          </div>
        );
      })
    );
  }
}

export default Toast;
