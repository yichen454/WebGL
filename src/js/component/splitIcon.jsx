import React from 'react'
import Hammer from 'hammerjs'
import EventBus from '../eventBus'

class SplitIcon extends React.PureComponent {

    state = {
        transform: 'translate(-20px, -20px)'
    }

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let _this = this;
        this.game_hammer = new Hammer(this.dom);
        this.game_hammer.on("hammer.input", function (e) {
            gestureInput(e);
        });

        function gestureInput(event) {
            if (event.pointers.length === 1) {
                switch (event.eventType) {
                    case 1:
                        touchStart(event.center.x, event.center.y);
                        break;
                    case 2:
                        touchMove(event.center.x, event.center.y);
                        break;
                    default:
                        touchEnd();
                        break;
                }
            } else {
                touchEnd();
            }
        }

        let touchStart = (x, y) => {


        }

        let touchMove = (x, y) => {
            let px = x - window.innerWidth / 2
            px = Math.min(Math.max(px, -window.innerWidth / 2), window.innerWidth / 2);
            this.setState({
                transform: 'translate(' + (px - 20) + 'px, -20px)'
            })

            EventBus.emit(EventBus.Event.splicIcon_event, px);
        }

        let touchEnd = () => {

        }
    }

    componentWillUnmount() {

    }


    render() {
        const style = {
            position: 'absolute',
            cursor: 'ew-resize',
            width: '40px',
            height: '40px',
            backgroundColor: '#F32196',
            opacity: 0.7,
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: this.state.transform
        }
        return (<div ref={(dom) => this.dom = dom} style={style}></div>)
    }

    _ResizeSet() {

    }

}

export default SplitIcon