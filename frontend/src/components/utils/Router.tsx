import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export type WithRouterParams = {
  collection_id: string;
}

export interface WithRouterProps {
  navigate: ReturnType<typeof useNavigate>;
  params: ReturnType<typeof useParams>;
}

export const withRouter = <Props extends WithRouterProps>(
  Component: React.ComponentType<Props>
) => {
  const Wrapper = (props: Omit<Props, keyof WithRouterProps>) => {
    const navigate = useNavigate();
    const params = useParams();
    return <Component {...(props as Props)} navigate={navigate} params={params} />;
  };

  return Wrapper;
};
