import { EventEmitter } from 'events'

class EventBus extends EventEmitter {

    Event = {
        joystick_event: 'joystick_event',
    }

    constructor(props) {
        super(props);
    }
};

export default new EventBus();