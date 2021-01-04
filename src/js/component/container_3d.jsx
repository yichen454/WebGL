import React from 'react'
import Renderer from '../graphics/Renderer.js'

class Container3d extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {};
    }

    componentDidMount() {
        let container_3d = document.getElementById('container_3d');
        this.renderer = new Renderer({
            container: container_3d,
            width: container_3d.clientWidth,
            height: container_3d.clientHeight
        });

        window.pageShowCbList.push(this.renderer.onResume);
        window.pageHideCbList.push(this.renderer.onPause);
    }

    componentWillUnmount() {
        _.deleteArrayItem(this.renderer.onResume, window.pageShowCbList);
        _.deleteArrayItem(this.renderer.onPause, window.pageHideCbList);
        this.renderer.onDestroy();
    }

    render() {
        return (
            <div id="container_3d" className="c3d ">
            </div>
        )
    }
}

export default Container3d