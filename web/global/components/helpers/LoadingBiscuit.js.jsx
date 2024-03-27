import React, { PureComponent } from 'react';
import { CSSTransition } from 'react-transition-group';
import Styles from './LoadingBiscuit.css'

export const BISCUIT_POSITION_TOP_LEFT = 'topLeft';
export const BISCUIT_POSITION_TOP_CENTER = 'topCenter';
export const BISCUIT_POSITION_TOP_RIGHT = 'topRight';
export const BISCUIT_POSITION_BOTTOM_LEFT = 'bottomLeft';
export const BISCUIT_POSITION_BOTTOM_CENTER = 'bottomCenter';
export const BISCUIT_POSITION_BOTTOM_RIGHT = 'bottomRight';
export const BISCUIT_POSITION_MIDDLE_CENTER = 'middleCenter';


const DEFAULT_CONTENT = 'Loading...'
const DEFAULT_POSITION = 'bottomCenter';
const DEFAULT_SHOW_SPINNER_ICON = true;
const DEFAULT_SPINNER_ICON_CLASS = ['fas', 'fa-spinner', 'fa-spin', Styles['fa-spinner']].join(" ");

export class LoadingBiscuit extends PureComponent {
  state = {
    content: DEFAULT_CONTENT
    , showSpinnerIcon: DEFAULT_SHOW_SPINNER_ICON
    , position: DEFAULT_POSITION // valid values are topLeft, topRight, topCenter, bottomLeft, bottomRight, bottomCenter
    , spinnerIconClass: DEFAULT_SPINNER_ICON_CLASS
  }

  render() {
    const {
      content
      , showSpinnerIcon
      , position
      , spinnerIconClass
    } = this.state;

    const {
      isVisible
    } = this.props;

    let classes = [Styles.loadingBiscuit, Styles[position]];
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
          timeout={600}
          classNames={transitionClassNames}>
            <table className = {classNames}>
              <tbody>
                <tr>
                  <td className={Styles['spinnerIconBox']}>
                      {
                        showSpinnerIcon ?
                        <i className={spinnerIconClass} />
                        : null
                      }
                  </td>
                  <td className={Styles.content}>{content}</td>
                </tr>
              </tbody>
            </table>
        </CSSTransition>
    )
  }
}
