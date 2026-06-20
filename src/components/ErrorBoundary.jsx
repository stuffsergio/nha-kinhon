import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">!</span>
            </div>
            <h1 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-3">
              Algo salió mal
            </h1>
            <p className="font-apple-body text-[17px] text-[#7a7a7a] mb-8">
            {this.state.error?.message || "Ha ocurrido un error inesperado."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#0066cc] text-white font-apple-body text-[17px] rounded-[9999px] px-[22px] py-[12px] hover:bg-[#0071e3] transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
