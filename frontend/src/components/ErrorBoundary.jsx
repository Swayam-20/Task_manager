import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, message: '' };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, message: error?.message || 'Unexpected application error.' };
    }

    componentDidCatch(error, errorInfo) {
        // Keep this for production diagnostics integrations later.
        console.error('Unhandled UI error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="loading-screen" style={{ padding: 24 }}>
                    <div className="card" style={{ maxWidth: 520, width: '100%' }}>
                        <div className="card-title" style={{ marginBottom: 8 }}>Something went wrong</div>
                        <p className="text-muted mb-16">
                            {this.state.message}
                        </p>
                        <button className="btn btn-primary" onClick={this.handleReload}>
                            Reload app
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
