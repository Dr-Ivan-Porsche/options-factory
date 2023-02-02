import { twMerge, join } from "tailwind-merge";
import { Component } from "react";
import { Outlet } from "react-router";
import Overlay from "../common/Overlay";
import { withRouter, WithRouterParams, WithRouterProps } from "../utils/Router";
import Toast from "../common/Toast";

class Layout extends Component<WithRouterProps> {
  componentDidMount() {}


  componentDidUpdate(prevProps: Readonly<WithRouterProps>): void {

  }

  componentWillUnmount() {}

  render() {
    return (
      <div 
        className={join(
          "relative",
          "w-[100%]",
          "mx-auto px-0",
          "self-center"
        )}
      >
        <Outlet />
        <Toast />
        <Overlay />
      </div>
    );
  }
}

export default withRouter(Layout);
