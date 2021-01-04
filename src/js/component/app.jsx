import React from 'react'
import Container3d from './container_3d'
import JoyStick from './joystick'

class App extends React.PureComponent {

    state = {
        needJoystick: false
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
            case 'carSence':
                this.setState({
                    needJoystick: true
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
            </div>
        )
    }
}

export default App