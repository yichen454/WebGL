import React from 'react'
import Container3d from './container_3d'
import JoyStick from './joystick'
import SplitIcon from './splitIcon'
import FaceMaskUtil from '../demo/utils/faceMaskUtil'

class App extends React.PureComponent {

    state = {
        open3d: false,
        needJoystick: false,
        needSplitIcon: false,
        enterFaceMaskUtil: false
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.choseSence();
    }

    choseSence() {
        let query = _.getQueryStringByName('scene')
        switch (query) {
            case 'carScene':
                this.setState({
                    open3d: true,
                    needJoystick: true
                })
                break;
            case 'beautyScene':
                this.setState({
                    open3d: true,
                    needSplitIcon: true
                })
                break;
            case 'faceMaskUtil':
                this.setState({
                    open3d: false,
                    enterFaceMaskUtil: true
                })
                break;
            default:
                this.setState({
                    open3d: true,
                })
                break;
        }
    }

    render() {
        return (
            <div className="wrapper_viewport" style={{ backgroundColor: "gray" }}>
                {this.state.open3d ? <Container3d /> : ""}
                {this.state.needJoystick ? <JoyStick /> : ""}
                {this.state.needSplitIcon ? <SplitIcon /> : ""}
                {this.state.enterFaceMaskUtil ? <FaceMaskUtil /> : ""}
            </div>
        )
    }
}

export default App