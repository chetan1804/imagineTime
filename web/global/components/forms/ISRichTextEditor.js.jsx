import React from 'react'

import PropTypes from 'prop-types'

import Binder from '../Binder.js.jsx';

import RichTextEditor from 'react-rte';

class ISRichTextEditor extends Binder {
  constructor(props) {
    super(props)

    this.state = {
      value: RichTextEditor.createEmptyValue()
    }

    this._bind(
      'onChange'
    )
  }

  componentDidMount() {
    const { defaultValue } = this.props;

    if(defaultValue) {
      this.setState({value: RichTextEditor.createValueFromString(defaultValue, 'html')})
    }

  }


  onChange(value) {
    this.setState({value});
    if (this.props.onChange) {
      this.props.onChange(
        value.toString('html')
      );
    }
  }

  render() {

    const {title,placeholder} = this.props;
    
    const {
      value
    } = this.state;

    return (
      <div>
        <div><strong>{title}</strong></div>
        <RichTextEditor
          className="react-rte-container"
          onChange={this.onChange}
          value={value}
          placeholder={placeholder}
        />
      </div>

    )
  }
}

ISRichTextEditor.propTypes = {
  onChange: PropTypes.func,
  title: PropTypes.string,
  defaultValue: PropTypes.string
}

export default ISRichTextEditor;