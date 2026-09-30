import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="full-center">
        <h1>Something broke on this page</h1>
        <p className="muted">
          Reload to try again. If it keeps happening, log out and back in.
        </p>
        <button
          className="btn btn--primary"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    );
  }
}