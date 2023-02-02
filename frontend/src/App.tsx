import { Component } from "react";
import { Navigate, Route, Routes } from "react-router";
import Layout from "./components/templates/Layout";
import { Subject } from 'rxjs'
import Issuance from './pages/Issuance';

window.Buffer = window.Buffer || require("buffer").Buffer;

class App extends Component {
  destroy$ = new Subject();

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true);
  }

  render() {
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Issuance />} />
          <Route path="/*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }
}

export default App;
