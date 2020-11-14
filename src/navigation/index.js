import {createAppContainer, createSwitchNavigator} from 'react-navigation'

import normalNavigator from './normal'
import authFlowNavigator from './authflow'
import loading from '../screens/loading'
import addBio from '../screens/addBio'

const appNavigator = createSwitchNavigator({
    loading: {screen: loading},
    auth: authFlowNavigator,
    addBio: {screen: addBio},
    normal: normalNavigator
},{
    initialRouteName: 'loading'
})

export default createAppContainer(appNavigator)