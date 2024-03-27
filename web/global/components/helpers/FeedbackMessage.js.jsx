import React, { PureComponent } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Styles from './FeedbackMessage.css'

export const MESSAGE_TYPE_SUCCESS = 'success';
export const MESSAGE_TYPE_INFO = 'info';
export const MESSAGE_TYPE_WARNING = 'warn';
export const MESSAGE_TYPE_ERROR = 'error';

export const MESSAGE_POSITION_TOP_LEFT = 'topLeft';
export const MESSAGE_POSITION_TOP_CENTER = 'topCenter';
export const MESSAGE_POSITION_TOP_RIGHT = 'topRight';
export const MESSAGE_POSITION_BOTTOM_LEFT = 'bottomLeft';
export const MESSAGE_POSITION_BOTTOM_CENTER = 'bottomCenter';
export const MESSAGE_POSITION_BOTTOM_RIGHT = 'bottomRight';


const DEFAULT_TYPE = 'success'
const DEFAULT_POSITION = 'topCenter';
const DEFAULT_SHOW_CLOSE_ICON = true;
const DEFAULT_AUTO_HIDE = true;
const DEFAULT_AUTO_HIDE_AFTER = 10;

const icons = {success: 'fa-check', info: 'fa-info', warn: 'fa-info', error: 'fa-exclamation-circle'};

export class FeedbackMessage extends PureComponent {
  state = {
    isVisible: false
    , message: ''
    , type: DEFAULT_TYPE // valid values are success, info, warn, error
    , autoHide: DEFAULT_AUTO_HIDE
    , autoHideAfter: DEFAULT_AUTO_HIDE_AFTER // in seconds
    , showCloseIcon: DEFAULT_SHOW_CLOSE_ICON
    , position: DEFAULT_POSITION // valid values are topLeft, topRight, topCenter, bottomLeft, bottomRight, bottomCenter
  }

  showSuccess = (message, position = DEFAULT_POSITION, showCloseIcon = DEFAULT_SHOW_CLOSE_ICON, autoHide = DEFAULT_AUTO_HIDE, autoHideAfterSeconds = DEFAULT_AUTO_HIDE_AFTER) => {
    this.show(message, MESSAGE_TYPE_SUCCESS, position, showCloseIcon, autoHide, autoHideAfterSeconds);
  }

  showInfo = (message, position = DEFAULT_POSITION, showCloseIcon = DEFAULT_SHOW_CLOSE_ICON, autoHide = DEFAULT_AUTO_HIDE, autoHideAfterSeconds = DEFAULT_AUTO_HIDE_AFTER) => {
    this.show(message, MESSAGE_TYPE_INFO, position, showCloseIcon, autoHide, autoHideAfterSeconds);
  }

  showWarning = (message, position = DEFAULT_POSITION, showCloseIcon = DEFAULT_SHOW_CLOSE_ICON, autoHide = false, autoHideAfterSeconds = DEFAULT_AUTO_HIDE_AFTER) => {
    this.show(message, MESSAGE_TYPE_WARNING, position, showCloseIcon, autoHide, autoHideAfterSeconds);
  }

  showError = (message, position = DEFAULT_POSITION, showCloseIcon = DEFAULT_SHOW_CLOSE_ICON, autoHide = false, autoHideAfterSeconds = DEFAULT_AUTO_HIDE_AFTER) => {
    this.show(message, MESSAGE_TYPE_ERROR, position, showCloseIcon, autoHide, autoHideAfterSeconds);
  }

  show = (message, type = DEFAULT_TYPE, position = DEFAULT_POSITION, showCloseIcon = DEFAULT_SHOW_CLOSE_ICON, autoHide = DEFAULT_AUTO_HIDE, autoHideAfterSeconds = DEFAULT_AUTO_HIDE_AFTER) => {
    this.setState(
      {
        isVisible: true
        , message
        , type
        , autoHide
        , autoHideAfter: autoHideAfterSeconds
        , showCloseIcon
        , position
      }
      , () => {
        if(autoHide) {
            setTimeout(() => {
                this.setState({ ...this.state, isVisible: false });
              }, (autoHideAfterSeconds * 1000));
        }
    });
  }

  hide = () => {
    this.setState({ ...this.state, isVisible: false });
  }

  render() {
    const {
      isVisible
      , message
      , type
      , showCloseIcon
      , position
    } = this.state;

    let icon = 'fas ' + (icons[type] || 'fa-check');
    let classes = [Styles.feedbackMessage, Styles[position], Styles[type]];
    const classNames = classes.join(" ");
    let transitionClassNames = {
      appear: Styles[position + '-appear'],
      appearActive: Styles[position + '-appear-active'],
      appearDone: Styles[position + '-appear-done'],
      enter: Styles[position + '-enter'],
      enterActive: Styles[position + '-enter-active'],
      enterDone: Styles[position + '-enter-done'],
      exit: Styles[position + '-exit'],
      exitActive: Styles[position + '-exit-active'],
      exitDone: Styles[position + '-exit-done']
    };
    return (
        <CSSTransition
          in={isVisible}
          timeout={500}
          classNames={transitionClassNames}>
            <table className = {classNames}>
              <tbody>
                <tr>
                  <td><i className={icon}/></td>
                  <td className={Styles.message}>{message}</td>
                  <td>
                      {
                        showCloseIcon ?
                        <span onClick={this.hide} className={['fas', 'fa-times', Styles['fa-times']].join(" ")} />
                        : null
                      }
                  </td>
                </tr>
              </tbody>
            </table>
        </CSSTransition>
    )
  }
}
