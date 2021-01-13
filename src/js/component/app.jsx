import React from 'react'
import Container3d from './container_3d'
import JoyStick from './joystick'
import SplitIcon from './splitIcon'

class App extends React.PureComponent {

    state = {
        needJoystick: false,
        needSplitIcon: false
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.choseSence();
    }

    choseSence() {
        let query = _.getQueryStringByName('sence')
        switch (query) {
            case 'carScene':
                this.setState({
                    needJoystick: true
                })
                break;
            case 'beautyScene':
                this.setState({
                    needSplitIcon: true
                })
                break;
            default:
                break;
        }
    }

    render() {
        return (
            <div className="wrapper_viewport" style={{ backgroundColor: "gray" }}>
                <Container3d />
                {this.state.needJoystick ? <JoyStick /> : ""}
                {this.state.needSplitIcon ? <SplitIcon /> : ""}
            </div>
        )
    }
}

export default App