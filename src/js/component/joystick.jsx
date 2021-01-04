import React from 'react'
import Hammer from 'hammerjs'
import { Vector2 } from 'three'
import EventBus from '../eventBus'

import css from './joystick.module.css'

class Joystick extends React.PureComponent {

    state = {

    }

    controls = {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        brake: false
    }

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.setTouch();
    }

    setTouch() {
        let scope = this;
        this.posStart = new Vector2();
        this.posNow = new Vector2();

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
            return scope.posNow;
        };
        function touchStart(_pX, _pY) {
            scope.posStart.set(_pX, _pY);
        };
        function touchMove(_pX, _pY) {
            scope.posNow.set(_pX - scope.posStart.x, _pY - scope.posStart.y);
            scope.posNow.clampLength(0, 40);
            scope.joyIn.style.transform = "translate(" +
                (scope.posNow.x - 34) + "px, " +
                (scope.posNow.y - 34) + "px)";

            if (scope.posNow.y < -5) {
                scope.controls.moveBackward = false;
                scope.controls.moveForward = true;
            } else if (scope.posNow.y > 5) {
                scope.controls.moveForward = false;
                scope.controls.moveBackward = true;
            } else {
                scope.controls.moveForward = false;
                scope.controls.moveBackward = false;
                scope.controls.brake = true;
            }
            if (scope.posNow.x > 5) {
                scope.controls.moveLeft = false;
                scope.controls.moveRight = true;
            } else if (scope.posNow.x < -5) {
                scope.controls.moveRight = false;
                scope.controls.moveLeft = true;
            } else {
                scope.controls.moveLeft = false;
                scope.controls.moveRight = false;
            }

            EventBus.emit(EventBus.Event.joystick_event, scope.controls);
        };
        function touchEnd() {
            scope.joyIn.style.transform = "translate(-34px, -34px)";
            scope.posNow.set(0, 0);

            scope.controls.brake = true;
            scope.controls.moveForward = false;
            scope.controls.moveBackward = false;
            scope.controls.moveLeft = false;
            scope.controls.moveRight = false;

            EventBus.emit(EventBus.Event.joystick_event, scope.controls);
        };
    }

    componentWillUnmount() {
        this.game_hammer.destroy();
    }


    render() {

        return (
            <div ref={(dom) => { this.dom = dom }} className={css.gameControl}>
                <svg ref={(dom) => { this.joyOut = dom }} className={css.joyStickOut}>
                    <circle className={css.circle} cx="60" cy="60" r="42"></circle>
                    <polyline className={css.stl} points="49 11 60 2 71 11"></polyline>
                    <polyline className={css.stl} points="11 49 2 60 11 71"></polyline>
                    <polyline className={css.stl} points="71 107 60 118 49 107"></polyline>
                    <polyline className={css.stl} points="107 71 118 60 107 49"></polyline>
                </svg>
                <svg ref={(dom) => { this.joyIn = dom }} className={css.joyStickIn}>
                    <circle className={css.circle} cx="34" cy="34" r="30"></circle>
                </svg>
            </div>
        )
    }
}

export default Joystick