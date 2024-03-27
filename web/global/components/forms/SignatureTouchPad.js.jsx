/**
 * Helper component for rendering basic text inputs
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';

// import components
import Binder from "../Binder.js.jsx";

class SignatureTouchPad extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            lines: [] // new Immutable.list()
            , isDrawing: false
        }

        this._bind(
            'handleMouseDown'
            , 'handleMouseMove'
            , 'handleMouseUp'
            , 'relativeCoordinatesForEvent'
        );
    }

    componentDidMount() {
        const { element } = this.props;
        document.addEventListener("mouseup", this.handleMouseUp);

        if (element) {
            let lines = _.cloneDeep(this.state.lines);
            lines = element.lines ? element.lines : lines;
            this.setState({ lines });
        }
    }
    
    componentWillUnmount() {
        document.removeEventListener("mouseup", this.handleMouseUp);
    }

    handleMouseDown(mouseEvent) {
        if (mouseEvent.button != 0) {
            return;
        }
        const point = this.relativeCoordinatesForEvent(mouseEvent);
        const lines = _.cloneDeep(this.state.lines);
        lines[lines.length] = [];
        lines[lines.length-1].push(point);
        this.setState({ lines, isDrawing: true });
    }

    handleMouseMove(mouseEvent) {
        const { handleGetResult } = this.props;
        if (!this.state.isDrawing) {
            return;
        }
        const point = this.relativeCoordinatesForEvent(mouseEvent);
        const lines = _.cloneDeep(this.state.lines);
        lines[lines.length-1].push(point);
        this.setState({ lines }, () => {
            handleGetResult(lines);
        });
    }

    handleMouseUp() {
        this.setState({ isDrawing: false });
    }

    relativeCoordinatesForEvent(mouseEvent) {
        const boundingRect = this.refs.drawArea.getBoundingClientRect();
        return {
            x: mouseEvent.clientX - boundingRect.left,
            y: mouseEvent.clientY - boundingRect.top,
        }
    }

    render() {
        const { isDrawing, lines } = this.state;
        const { element } = this.props;
        return (
            <div
                className={`drawArea ${isDrawing ? "-active" : ""}`}
                ref="drawArea"
                onMouseDown={this.handleMouseDown}
                onMouseMove={this.handleMouseMove}
            >
                <Drawing lines={this.state.lines} element={element} />
            </div>
        )
    }
}

export default SignatureTouchPad;

class Drawing extends Binder {
    constructor(props) {
        super(props);
    }

    render() {
        const { lines, element } = this.props;
        return (
            <svg className="drawing">
                {lines.map((line, index) => (
                    <DrawingLine key={index} line={line} element={element} />
                ))}
          </svg>
        )
    }
}

class DrawingLine extends Binder {
    constructor(props) {
        super(props);
    }

    render() {
        const { line, element } = this.props;
        const pathData = "M " + line.map(p => `${p.x} ${p.y}`).join(" L ");
        return <path className="path" d={pathData}  stroke={element.penColor || "black"} strokeWidth="2" strokeLinecap="round" fill="transparent" />;
    }
}
