import React, { Component } from 'react'
import { Image } from 'react-native'
import auth from '@react-native-firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

var unsubscribe
export default class Loading extends Component {

    componentDidMount() {
        unsubscribe = auth().onAuthStateChanged(async user => {
            if (user === null) {
                this.props.navigation.navigate('auth')
            }
            else {

                var bioDone = await AsyncStorage.getItem('bioDone')
                // console.log("BIODONE", bioDone)
                if(bioDone === 'done') {
                    this.props.navigation.navigate('normal')
                }
                else {
                    var data = await AsyncStorage.getItem('data')
                    data = await JSON.parse(data)
                    this.props.navigation.navigate('addBio', data)
                }
            }
        })
    }

    componentWillUnmount() {
        unsubscribe()
    }

    render() {
        return (
            <Image source={require('../../Assets/launch_screen.png')} />
        )
    }

}