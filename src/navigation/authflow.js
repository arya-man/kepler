import {createStackNavigator} from 'react-navigation-stack'

import login from '../screens/login'
import signUp from '../screens/signUp'
import forgotPassword from '../screens/forgotPassword'


const authFlowNavigator = createStackNavigator({
    login: {
        screen: login
    },
    signUp: {
        screen: signUp
    },
    forgotPassword: {
        screen: forgotPassword
    },

},{
    headerMode: 'none'
})

export default authFlowNavigator