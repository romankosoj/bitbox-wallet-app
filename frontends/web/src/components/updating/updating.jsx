import { apiWebsocket } from '../../utils/websocket';
import { apiGet } from '../../utils/request';
import { equal } from '../../utils/equal';
import LoadingComponent from '../loading/loading';

// Loads API endpoints into the state and updates them on events.
export default class UpdatingComponent extends LoadingComponent {
    // Subclasses should implement the following function:
    // getStateMap() {
    //     return { key: 'url/' + this.props.value };
    // }

    mapState(stateMap) {
        super.mapState(stateMap);
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }
        this.unsubscribe = apiWebsocket(({ subject, action, object }) => {
            if (!subject || !action) {
                return;
            }
            Object.entries(stateMap).forEach(
                ([key, url]) => {
                    if (subject === url) {
                        switch (action) {
                        case 'replace':
                            this.setState({ [key]: object });
                            break;
                        case 'prepend':
                            this.setState(state => ({ [key]: [object, ...state[key]] }));
                            break;
                        case 'append':
                            this.setState(state => ({ [key]: [...state[key], object] }));
                            break;
                        case 'remove':
                            this.setState(state => ({ [key]: state[key].filter(item => !equal(item, object)) }));
                            break;
                        case 'reload':
                            apiGet(url).then(object => this.setState({ [key]: object }));
                            break;
                        }
                    }
                }
            );
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }
    }
}
