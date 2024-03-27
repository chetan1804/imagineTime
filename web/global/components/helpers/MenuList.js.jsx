import React from 'react';
import Binder from '../../../global/components/Binder.js.jsx';
import { FixedSizeList as List } from "react-window";

class MenuList extends Binder {
    render() {
        const { options, children, maxHeight, getValue } = this.props;
        const [value] = getValue();
        const height = 50;
        const initialOffset = 1;

        const optionsCount = options.length ? options.length : 1
        const optionsHeight = optionsCount > 8 ? maxHeight : optionsCount * 51;

        const checkSelectIfSecretQuestion = () => {
            let issq = false;
            if(options && options.length > 0) {
                for(const opt of options) {
                    if(opt.name == 'selectedQuestion') {
                        issq = true;
                        break;
                    }
                }
            }
            return issq;
        }
        const Row = ({index, style}) => {
            const newStyle = {...style, ['height'] : 'auto', ['position']:'relative', ['top']: '0'}
            //const newStyle = {...style, ['height']: 'auto', ['position']: 'relative'}
            return (
                <div style={style}>{children[index]}</div>
            )
        }

        const noOptionStyle = {
            "position": "absolute",
            "width": "100%",
            "height": "51px",
            "overflow": "hidden",
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center"
        }

        return (
            children && children.length && children.length > 0 ?
            <List
                height={optionsHeight}
                itemCount={children.length}
                itemSize={height}
                initialScrollOffset={initialOffset}
            >
            {
                Row
            }
            </List> 
            :
            <List
                height={51}
                itemCount={1}
                itemSize={height}
                initialScrollOffset={51}
            >
                {(index, style) => <div style={noOptionStyle}><span>No options</span></div>}
            </List>
        )
    }
}

export default MenuList;